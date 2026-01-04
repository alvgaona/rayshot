import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Grid,
  Icon,
  showToast,
  Toast,
} from "@raycast/api";
import { exec } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { promisify } from "util";
import { useEffect, useState } from "react";
import {
  getHistory,
  removeFromHistory,
  clearHistory,
  ScreenshotEntry,
} from "./history";

const execAsync = promisify(exec);

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function getModeLabel(mode: ScreenshotEntry["mode"]): string {
  switch (mode) {
    case "area":
      return "Area";
    case "window":
      return "Window";
    case "fullscreen":
      return "Fullscreen";
  }
}

export default function Command() {
  const [history, setHistory] = useState<ScreenshotEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    const entries = await getHistory();
    const validEntries = entries.filter((entry) => existsSync(entry.filepath));

    // Clean up stale entries from storage
    const staleEntries = entries.filter((entry) => !existsSync(entry.filepath));
    for (const stale of staleEntries) {
      await removeFromHistory(stale.id);
    }

    setHistory(validEntries);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpen = async (entry: ScreenshotEntry) => {
    await execAsync(`open "${entry.filepath}"`);
  };

  const handleReveal = async (entry: ScreenshotEntry) => {
    await execAsync(`open -R "${entry.filepath}"`);
  };

  const handleCopy = async (entry: ScreenshotEntry) => {
    await execAsync(
      `osascript -e 'set the clipboard to (read (POSIX file "${entry.filepath}") as TIFF picture)'`,
    );
    await showToast({
      style: Toast.Style.Success,
      title: "Copied to clipboard",
    });
  };

  const handleDelete = async (entry: ScreenshotEntry) => {
    const confirmed = await confirmAlert({
      title: "Delete Screenshot",
      message: "This will permanently delete the file. Are you sure?",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        if (existsSync(entry.filepath)) {
          unlinkSync(entry.filepath);
        }
        await removeFromHistory(entry.id);
        await loadHistory();
        await showToast({
          style: Toast.Style.Success,
          title: "Screenshot deleted",
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to delete",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirmAlert({
      title: "Clear History",
      message:
        "This will clear the history but won't delete the files. Are you sure?",
      primaryAction: {
        title: "Clear",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await clearHistory();
      await loadHistory();
      await showToast({ style: Toast.Style.Success, title: "History cleared" });
    }
  };

  return (
    <Grid
      isLoading={isLoading}
      columns={3}
      fit={Grid.Fit.Fill}
      searchBarPlaceholder="Search screenshots..."
    >
      {history.length === 0 ? (
        <Grid.EmptyView
          icon={Icon.Camera}
          title="No Screenshots Yet"
          description="Captured screenshots will appear here"
        />
      ) : (
        history.map((entry) => (
          <Grid.Item
            key={entry.id}
            content={{ source: entry.filepath }}
            title={formatDate(entry.timestamp)}
            subtitle={getModeLabel(entry.mode)}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title="Copy to Clipboard"
                    icon={Icon.Clipboard}
                    onAction={() => handleCopy(entry)}
                  />
                  <Action
                    title="Open"
                    icon={Icon.Eye}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                    onAction={() => handleOpen(entry)}
                  />
                  <Action
                    title="Reveal in Finder"
                    icon={Icon.Finder}
                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                    onAction={() => handleReveal(entry)}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Delete"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={() => handleDelete(entry)}
                  />
                  <Action
                    title="Clear All History"
                    icon={Icon.XMarkCircle}
                    style={Action.Style.Destructive}
                    onAction={handleClearAll}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </Grid>
  );
}
