import { useCapture } from "./use-capture";

export default function Command() {
  useCapture("window");
  return null;
}
