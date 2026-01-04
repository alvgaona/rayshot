import { closeMainWindow } from "@raycast/api";
import { captureScreenshot } from "./utils";

export default async function Command() {
  await closeMainWindow();
  await captureScreenshot("area", "file");
}
