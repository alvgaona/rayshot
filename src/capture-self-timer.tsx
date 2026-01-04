import { getPreferenceValues } from "@raycast/api";
import { useCapture } from "./use-capture";

interface CommandPreferences {
  timerDelay: string;
}

export default function Command() {
  const preferences = getPreferenceValues<CommandPreferences>();
  const delaySeconds = parseInt(preferences.timerDelay || "3", 10);

  useCapture("area", { delaySeconds, forcePreview: true });
  return null;
}
