import {
  closeMainWindow,
  launchCommand,
  LaunchType,
  getPreferenceValues,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useRef } from "react";
import {
  captureToTemp,
  copyToClipboard,
  saveToFile,
  saveToInternal,
  deleteTempFile,
  CaptureMode,
} from "./utils";
import { addToHistory } from "./history";

interface CommandPreferences {
  showPreview: boolean;
  defaultAction: "copy" | "save" | "both";
  saveLocation?: string;
}

interface UseCaptureOptions {
  delaySeconds?: number;
  forcePreview?: boolean;
}

/**
 * Performs the default action (copy/save/both) after capturing a screenshot
 */
async function performDefaultAction(
  result: { filepath: string; filename: string },
  preferences: CommandPreferences,
  mode: CaptureMode,
) {
  // Perform default action directly
  const action = preferences.defaultAction || "copy";
  let copySuccess = false;
  let saveSuccess = false;

  // Handle clipboard copy
  if (action === "copy" || action === "both") {
    try {
      await copyToClipboard(result.filepath);
      copySuccess = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Clipboard copy failed:", errorMessage);
      await showToast({
        style: Toast.Style.Failure,
        title: "Copy failed",
        message: errorMessage,
      });
    }
  }

  // Handle file save
  if (action === "save" || action === "both") {
    try {
      const savedPath = await saveToFile(
        result.filepath,
        result.filename,
        preferences.saveLocation,
      );
      saveSuccess = !!savedPath;

      if (!savedPath) {
        await showToast({
          style: Toast.Style.Failure,
          title: "No save location configured",
          message: "Set a save location in preferences",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("File save failed:", errorMessage);
      await showToast({
        style: Toast.Style.Failure,
        title: "Save failed",
        message: errorMessage,
      });
    }
  }

  // Save to history (best effort - don't fail the entire operation if this fails)
  try {
    const internalPath = saveToInternal(result.filepath, result.filename);
    await addToHistory({
      filepath: internalPath,
      filename: result.filename,
      timestamp: Date.now(),
      mode,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("History save failed:", errorMessage);
    // Don't show error to user - this is a non-critical operation
  }

  // Clean up temp file
  deleteTempFile(result.filepath);

  // Show success message based on what worked
  if (action === "copy" && copySuccess) {
    await showHUD("Copied to clipboard");
  } else if (action === "save" && saveSuccess) {
    await showHUD(`Saved to ${result.filename}`);
  } else if (action === "both") {
    if (copySuccess && saveSuccess) {
      await showHUD("Copied and saved");
    } else if (copySuccess) {
      await showHUD("Copied to clipboard");
    } else if (saveSuccess) {
      await showHUD(`Saved to ${result.filename}`);
    }
    // If both failed, errors were already shown via toast
  }
}

/**
 * Shared hook for all capture commands to eliminate code duplication.
 * Handles the capture flow including preview, clipboard, file saving, and history.
 *
 * @param mode - The capture mode: "area", "window", or "fullscreen"
 * @param options - Optional settings: delaySeconds for self-timer, forcePreview to always show preview
 */
export function useCapture(mode: CaptureMode, options?: UseCaptureOptions) {
  const isCapturing = useRef(false);
  const preferences = getPreferenceValues<CommandPreferences>();
  const { delaySeconds, forcePreview } = options || {};

  useEffect(() => {
    if (isCapturing.current) return;
    isCapturing.current = true;

    async function capture() {
      await closeMainWindow();

      const result = await captureToTemp(mode, delaySeconds);
      if (!result) return;

      if (forcePreview || preferences.showPreview) {
        try {
          await launchCommand({
            name: "capture-preview",
            type: LaunchType.UserInitiated,
            context: {
              filepath: result.filepath,
              filename: result.filename,
              mode,
              saveLocation: preferences.saveLocation,
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Failed to launch preview:", errorMessage);
          await showToast({
            style: Toast.Style.Failure,
            title: "Preview failed",
            message: "Falling back to default action",
          });

          // Fallback to default action if preview fails
          await performDefaultAction(result, preferences, mode);
        }
      } else {
        await performDefaultAction(result, preferences, mode);
      }
    }
    capture();
  }, [mode, delaySeconds, forcePreview, preferences]);
}
