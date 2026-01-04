import { LocalStorage } from "@raycast/api";

export interface ScreenshotEntry {
  id: string;
  filepath: string;
  filename: string;
  timestamp: number;
  mode: "area" | "window" | "fullscreen";
}

const HISTORY_KEY = "screenshot_history";
const MAX_HISTORY = 100;

export async function getHistory(): Promise<ScreenshotEntry[]> {
  const data = await LocalStorage.getItem<string>(HISTORY_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addToHistory(
  entry: Omit<ScreenshotEntry, "id">,
): Promise<void> {
  const history = await getHistory();
  const newEntry: ScreenshotEntry = {
    ...entry,
    id: `${entry.timestamp}-${Math.random().toString(36).slice(2, 9)}`,
  };

  history.unshift(newEntry);

  // Keep only the most recent entries
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }

  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function removeFromHistory(id: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((entry) => entry.id !== id);
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function clearHistory(): Promise<void> {
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}
