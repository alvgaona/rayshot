import {
  Action,
  ActionPanel,
  Detail,
  Icon,
  LaunchProps,
  showHUD,
  showToast,
  Toast,
  popToRoot,
} from "@raycast/api";
import {
  copyToClipboard,
  saveToFile,
  saveToInternal,
  deleteTempFile,
  getBase64DataUrl,
  getImageDimensions,
} from "./utils";
import { addToHistory } from "./history";
import { statSync, existsSync } from "fs";
import { useEffect, useState } from "react";

interface PreviewContext {
  filepath: string;
  filename: string;
  mode: "area" | "window" | "fullscreen";
  saveLocation?: string;
}

export default function Command(
  props: LaunchProps<{ launchContext: PreviewContext }>,
) {
  const context = props.launchContext;
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  if (!context) {
    return <Detail markdown="No screenshot to preview" />;
  }

  const { filepath, filename, mode, saveLocation } = context;

  // Validate file exists
  if (!existsSync(filepath)) {
    return (
      <Detail markdown="Screenshot file not found. The file may have been deleted." />
    );
  }

  const timestamp = new Date();
  let stats;
  let imageDataUrl;

  try {
    stats = statSync(filepath);
    imageDataUrl = getBase64DataUrl(filepath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to load screenshot:", errorMessage);
    return <Detail markdown={`Failed to load screenshot: ${errorMessage}`} />;
  }

  const fileSizeKB = Math.round(stats.size / 1024);

  // Load image dimensions
  useEffect(() => {
    getImageDimensions(filepath).then(setDimensions);
  }, [filepath]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(filepath);

      try {
        const internalPath = saveToInternal(filepath, filename);
        await addToHistory({
          filepath: internalPath,
          filename,
          timestamp: Date.now(),
          mode,
        });
      } catch (error) {
        // Non-critical - don't fail the copy operation
        console.error("Failed to save to history:", error);
      }

      deleteTempFile(filepath);
      await showHUD("Copied to clipboard");
      await popToRoot();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Copy failed",
        message: errorMessage,
      });
    }
  };

  const handleSave = async () => {
    try {
      const savedPath = await saveToFile(filepath, filename, saveLocation);
      if (savedPath) {
        try {
          const internalPath = saveToInternal(filepath, filename);
          await addToHistory({
            filepath: internalPath,
            filename,
            timestamp: Date.now(),
            mode,
          });
        } catch (error) {
          // Non-critical - don't fail the save operation
          console.error("Failed to save to history:", error);
        }

        deleteTempFile(filepath);
        await showHUD(`Saved to ${filename}`);
        await popToRoot();
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
  };

  const handleBoth = async () => {
    let copySuccess = false;
    let saveSuccess = false;

    try {
      await copyToClipboard(filepath);
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
      const savedPath = await saveToFile(filepath, filename, saveLocation);
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
      await showToast({
        style: Toast.Style.Failure,
        title: "Save failed",
        message: errorMessage,
      });
    }

    if (copySuccess || saveSuccess) {
      try {
        const internalPath = saveToInternal(filepath, filename);
        await addToHistory({
          filepath: internalPath,
          filename,
          timestamp: Date.now(),
          mode,
        });
      } catch (error) {
        // Non-critical - don't fail the operation
        console.error("Failed to save to history:", error);
      }

      deleteTempFile(filepath);

      if (copySuccess && saveSuccess) {
        await showHUD("Copied and saved");
      } else if (copySuccess) {
        await showHUD("Copied to clipboard");
      } else if (saveSuccess) {
        await showHUD(`Saved to ${filename}`);
      }

      await popToRoot();
    }
  };

  const handleCancel = () => {
    deleteTempFile(filepath);
    popToRoot();
  };

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  const fileExtension = filename.split(".").pop()?.toUpperCase() || "PNG";
  const formattedDateTime = timestamp.toLocaleString();

  return (
    <Detail
      markdown={`![Screenshot](${imageDataUrl})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Filename" text={filename} />
          <Detail.Metadata.Label title="Type" text={modeLabel} />
          <Detail.Metadata.Label title="Format" text={fileExtension} />
          <Detail.Metadata.Label title="Size" text={`${fileSizeKB} KB`} />
          {dimensions && (
            <Detail.Metadata.Label
              title="Dimensions"
              text={`${dimensions.width} × ${dimensions.height}`}
            />
          )}
          <Detail.Metadata.Label title="Captured" text={formattedDateTime} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Copy to Clipboard"
            icon={Icon.Clipboard}
            onAction={handleCopy}
          />
          <Action
            title="Save to File"
            icon={Icon.HardDrive}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={handleSave}
          />
          <Action
            title="Copy and Save"
            icon={Icon.Plus}
            shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
            onAction={handleBoth}
          />
          <Action
            title="Cancel"
            icon={Icon.XMarkCircle}
            shortcut={{ modifiers: ["cmd"], key: "." }}
            style={Action.Style.Destructive}
            onAction={handleCancel}
          />
        </ActionPanel>
      }
    />
  );
}
