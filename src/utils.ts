import {
  environment,
  getPreferenceValues,
  showToast,
  showHUD,
  Toast,
} from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  unlinkSync,
} from "fs";

const execAsync = promisify(exec);

interface Preferences {
  saveLocation: string;
  playSoundEffect: boolean;
  filenamePattern: string;
  imageFormat: "png" | "jpeg" | "webp";
  jpegQuality: string;
  webpQuality: string;
}

export type CaptureMode = "area" | "window" | "fullscreen";
export type CaptureDestination = "clipboard" | "file" | "both";

export interface CaptureResult {
  filepath: string;
  filename: string;
}

// Internal captures folder within Raycast's support directory
const CAPTURES_DIR = join(environment.supportPath, "captures");

function ensureCapturesDir(): void {
  if (!existsSync(CAPTURES_DIR)) {
    mkdirSync(CAPTURES_DIR, { recursive: true });
  }
}

// Temp folder for captures before user confirms
const TEMP_DIR = "/tmp/rayshot";

/**
 * Generates a filename based on the user's pattern preference.
 * Supports variables: {mode}, {date}, {time}, {timestamp}
 *
 * @param mode - The capture mode (area, window, fullscreen)
 * @returns The generated filename with the appropriate extension
 */
function generateFilename(mode: CaptureMode): string {
  const preferences = getPreferenceValues<Preferences>();
  const pattern = preferences.filenamePattern || "Screenshot_{date}_{time}";
  const format = preferences.imageFormat || "png";

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const date = `${year}-${month}-${day}`;
  const time = `${hours}-${minutes}-${seconds}`;
  const timestamp = Date.now().toString();

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();

  let filename = pattern
    .replace(/{mode}/g, modeLabel)
    .replace(/{date}/g, date)
    .replace(/{time}/g, time)
    .replace(/{timestamp}/g, timestamp);

  // Remove any existing image extensions
  filename = filename.replace(/\.(png|jpe?g|webp)$/i, "");

  // Add the correct extension based on format
  const extension = format === "jpeg" ? "jpg" : format;
  filename += `.${extension}`;

  return filename;
}

function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

/**
 * Copies an image file to the clipboard.
 * @param filepath - The path to the image file
 * @throws Error if the file doesn't exist or clipboard operation fails
 */
export async function copyToClipboard(filepath: string): Promise<void> {
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  try {
    await execAsync(
      `osascript -e 'set the clipboard to (read (POSIX file "${filepath}") as TIFF picture)'`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Clipboard copy failed:", errorMessage);
    throw new Error(`Failed to copy to clipboard: ${errorMessage}`);
  }
}

/**
 * Saves an image file to the user's specified location.
 * @param filepath - The source file path
 * @param filename - The desired filename
 * @param overrideLocation - Optional location override
 * @returns The saved file path, or null if no save location is configured
 * @throws Error if the source file doesn't exist or save operation fails
 */
export async function saveToFile(
  filepath: string,
  filename: string,
  overrideLocation?: string,
): Promise<string | null> {
  if (!existsSync(filepath)) {
    throw new Error(`Source file not found: ${filepath}`);
  }

  const preferences = getPreferenceValues<Preferences>();
  const saveLocation = overrideLocation || preferences.saveLocation;

  if (!saveLocation) {
    return null;
  }

  const expandedLocation = expandPath(saveLocation);

  // Ensure the save directory exists
  if (!existsSync(expandedLocation)) {
    throw new Error(`Save location does not exist: ${expandedLocation}`);
  }

  try {
    const userPath = join(expandedLocation, filename);
    copyFileSync(filepath, userPath);
    return userPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("File save failed:", errorMessage);

    // Check for common errors
    if (errorMessage.includes("EACCES") || errorMessage.includes("EPERM")) {
      throw new Error(`Permission denied: Cannot write to ${expandedLocation}`);
    } else if (errorMessage.includes("ENOSPC")) {
      throw new Error("Disk full: Not enough space to save screenshot");
    } else {
      throw new Error(`Failed to save file: ${errorMessage}`);
    }
  }
}

/**
 * Saves a temp file to internal storage for history.
 * @param tempPath - The temporary file path
 * @param filename - The filename to use
 * @returns The internal storage path
 * @throws Error if save operation fails
 */
export function saveToInternal(tempPath: string, filename: string): string {
  if (!existsSync(tempPath)) {
    throw new Error(`Temporary file not found: ${tempPath}`);
  }

  try {
    ensureCapturesDir();
    const internalPath = join(CAPTURES_DIR, filename);
    copyFileSync(tempPath, internalPath);
    return internalPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to save to internal storage:", errorMessage);

    if (errorMessage.includes("ENOSPC")) {
      throw new Error("Disk full: Cannot save to history");
    } else if (
      errorMessage.includes("EACCES") ||
      errorMessage.includes("EPERM")
    ) {
      throw new Error("Permission denied: Cannot save to internal storage");
    } else {
      throw new Error(`Failed to save to history: ${errorMessage}`);
    }
  }
}

/**
 * Converts an image to the specified format using sips
 * @param inputPath - The input file path
 * @param outputPath - The output file path
 * @param format - The target format (png, jpeg, webp)
 * @param quality - Quality setting (0-100), used for JPEG and WebP formats
 */
async function convertImageFormat(
  inputPath: string,
  outputPath: string,
  format: "png" | "jpeg" | "webp",
  quality?: number,
): Promise<void> {
  if (format === "png") {
    // No conversion needed, just copy
    if (inputPath !== outputPath) {
      copyFileSync(inputPath, outputPath);
    }
    return;
  }

  try {
    const qualityValue = quality || 85;
    if (format === "webp") {
      // Use sips to convert to WebP with quality setting
      await execAsync(
        `sips -s format webp -s formatOptions ${qualityValue} "${inputPath}" --out "${outputPath}"`,
      );
    } else if (format === "jpeg") {
      // Use sips to convert to JPEG with quality setting
      await execAsync(
        `sips -s format jpeg -s formatOptions ${qualityValue} "${inputPath}" --out "${outputPath}"`,
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to convert to ${format}:`, errorMessage);
    throw new Error(`Image format conversion failed: ${errorMessage}`);
  }
}

// Get base64 data URL from file
export function getBase64DataUrl(filepath: string): string {
  const buffer = readFileSync(filepath);
  const base64 = buffer.toString("base64");

  // Determine MIME type from file extension
  const ext = filepath.split(".").pop()?.toLowerCase();
  let mimeType = "image/png";
  if (ext === "jpg" || ext === "jpeg") {
    mimeType = "image/jpeg";
  } else if (ext === "webp") {
    mimeType = "image/webp";
  }

  return `data:${mimeType};base64,${base64}`;
}

// Get image dimensions
export async function getImageDimensions(
  filepath: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const { stdout } = await execAsync(
      `sips -g pixelWidth -g pixelHeight "${filepath}" | grep -E "pixelWidth|pixelHeight" | awk '{print $2}'`,
    );
    const lines = stdout.trim().split("\n");
    if (lines.length === 2) {
      const width = parseInt(lines[0], 10);
      const height = parseInt(lines[1], 10);
      if (!isNaN(width) && !isNaN(height)) {
        return { width, height };
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to get image dimensions:", error);
    return null;
  }
}

// Delete temp file
export function deleteTempFile(filepath: string): void {
  if (existsSync(filepath) && filepath.startsWith(TEMP_DIR)) {
    unlinkSync(filepath);
  }
}

/**
 * Captures a screenshot to a temporary location.
 * @param mode - The capture mode (area, window, fullscreen)
 * @param delaySeconds - Optional delay in seconds before capture (overrides preference)
 * @returns The capture result with filepath and filename, or null if cancelled/failed
 */
export async function captureToTemp(
  mode: CaptureMode,
  delaySeconds?: number,
): Promise<CaptureResult | null> {
  const preferences = getPreferenceValues<Preferences>();

  // Ensure temp directory exists
  try {
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR, { recursive: true });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to create temp directory:", errorMessage);
    await showToast({
      style: Toast.Style.Failure,
      title: "Screenshot failed",
      message: "Could not create temporary directory",
    });
    return null;
  }

  const filename = generateFilename(mode);
  const format = preferences.imageFormat || "png";

  // screencapture always outputs PNG, so capture to PNG first
  const tempPngPath = join(TEMP_DIR, `temp_${Date.now()}.png`);
  const finalPath = join(TEMP_DIR, filename);

  const args: string[] = [];

  switch (mode) {
    case "area":
      args.push("-i");
      break;
    case "window":
      args.push("-i", "-w");
      break;
    case "fullscreen":
      break;
  }

  if (!preferences.playSoundEffect) {
    args.push("-x");
  }

  // Add delay flag if specified (for self-timer) - must come before filepath
  if (delaySeconds !== undefined && delaySeconds > 0) {
    args.push(`-T${delaySeconds}`);
  }

  args.push(`"${tempPngPath}"`);

  const command = `/usr/sbin/screencapture ${args.join(" ")}`;

  try {
    // Show HUD before capture if using self-timer
    if (delaySeconds !== undefined && delaySeconds > 0) {
      await showHUD(`Select area, then capture in ${delaySeconds}s`);
    }

    const { stderr } = await execAsync(command);

    if (stderr) {
      console.error("screencapture stderr:", stderr);
    }

    if (!existsSync(tempPngPath)) {
      return null; // User cancelled
    }

    // Convert to desired format if not PNG
    try {
      let quality: number | undefined;
      if (format === "jpeg") {
        quality = parseInt(preferences.jpegQuality || "85", 10);
      } else if (format === "webp") {
        quality = parseInt(preferences.webpQuality || "85", 10);
      }

      await convertImageFormat(tempPngPath, finalPath, format, quality);

      // Clean up temp PNG if conversion created a different file
      if (tempPngPath !== finalPath && existsSync(tempPngPath)) {
        unlinkSync(tempPngPath);
      }
    } catch (error) {
      // Clean up temp PNG on conversion failure
      if (existsSync(tempPngPath)) {
        unlinkSync(tempPngPath);
      }
      throw error;
    }

    return { filepath: finalPath, filename };
  } catch (error) {
    // Exit code 1 means user cancelled
    if (error instanceof Error && error.message.includes("exit code 1")) {
      return null;
    }

    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error("Screenshot error:", errorDetails);
    console.error("Command was:", command);

    // Provide user-friendly error messages
    let userMessage = "Screenshot capture failed";
    if (errorDetails.includes("screen recording")) {
      userMessage = "Screen recording permission required";
    } else if (errorDetails.includes("not found")) {
      userMessage = "screencapture command not found";
    }

    await showToast({
      style: Toast.Style.Failure,
      title: userMessage,
      message: errorDetails.slice(0, 100),
    });
    return null;
  }
}

/**
 * Captures a screenshot with a specific destination (for direct-to-file commands).
 * @param mode - The capture mode
 * @param destination - Where to send the screenshot (clipboard, file, or both)
 */
export async function captureScreenshot(
  mode: CaptureMode,
  destination: CaptureDestination,
): Promise<void> {
  const result = await captureToTemp(mode);

  if (!result) return;

  try {
    switch (destination) {
      case "clipboard": {
        try {
          await copyToClipboard(result.filepath);
          await showHUD("Copied to clipboard");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await showToast({
            style: Toast.Style.Failure,
            title: "Copy failed",
            message: errorMessage,
          });
        }
        break;
      }
      case "file": {
        try {
          const savedPath = await saveToFile(result.filepath, result.filename);
          if (savedPath) {
            await showHUD(`Saved to ${result.filename}`);
          } else {
            await showToast({
              style: Toast.Style.Failure,
              title: "No save location configured",
              message: "Set a save location in preferences",
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await showToast({
            style: Toast.Style.Failure,
            title: "Save failed",
            message: errorMessage,
          });
        }
        break;
      }
      case "both": {
        let copySuccess = false;
        let saveSuccess = false;

        try {
          await copyToClipboard(result.filepath);
          copySuccess = true;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await showToast({
            style: Toast.Style.Failure,
            title: "Copy failed",
            message: errorMessage,
          });
        }

        try {
          const filePath = await saveToFile(result.filepath, result.filename);
          saveSuccess = !!filePath;

          if (!filePath) {
            await showToast({
              style: Toast.Style.Failure,
              title: "No save location configured",
              message: "Set a save location in preferences",
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await showToast({
            style: Toast.Style.Failure,
            title: "Save failed",
            message: errorMessage,
          });
        }

        if (copySuccess && saveSuccess) {
          await showHUD("Copied and saved");
        } else if (copySuccess) {
          await showHUD("Copied to clipboard");
        } else if (saveSuccess) {
          await showHUD(`Saved to ${result.filename}`);
        }
        break;
      }
    }
  } finally {
    // Always clean up temp file
    deleteTempFile(result.filepath);
  }
}
