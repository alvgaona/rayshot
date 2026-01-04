/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Save Location - Where to save screenshots when saving to file */
  "saveLocation": string,
  /** Sound Effect - Play sound when screenshot is taken */
  "playSoundEffect": boolean,
  /** Filename Pattern - Pattern for screenshot filenames. Available variables: {mode}, {date}, {time}, {timestamp} */
  "filenamePattern": string,
  /** Image Format - Choose the format for saving screenshots. PNG is lossless and best for quality. JPEG offers smaller files with adjustable quality (see JPEG Quality setting below). WebP provides excellent compression with modern browser support. */
  "imageFormat": "png" | "jpeg" | "webp",
  /** JPEG Quality - Compression quality for JPEG format. Higher quality = larger file size. Only applies when Image Format is set to JPEG. Recommended: 85 for general use, 90 for high-quality screenshots, 75 for smaller files. */
  "jpegQuality": "90" | "85" | "75",
  /** WebP Quality - Compression quality for WebP format. Higher quality = larger file size. Only applies when Image Format is set to WebP. WebP typically produces smaller files than JPEG at the same quality level. */
  "webpQuality": "90" | "85" | "75"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `capture-area` command */
  export type CaptureArea = ExtensionPreferences & {
  /** Show Preview - Show preview after capture (if disabled, uses default action) */
  "showPreview": boolean,
  /** Default Action - Action to perform when preview is disabled */
  "defaultAction": "copy" | "save" | "both",
  /** Save Location - Where to save screenshots (overrides global setting) */
  "saveLocation"?: string
}
  /** Preferences accessible in the `capture-window` command */
  export type CaptureWindow = ExtensionPreferences & {
  /** Show Preview - Show preview after capture (if disabled, uses default action) */
  "showPreview": boolean,
  /** Default Action - Action to perform when preview is disabled */
  "defaultAction": "copy" | "save" | "both",
  /** Save Location - Where to save screenshots (overrides global setting) */
  "saveLocation"?: string
}
  /** Preferences accessible in the `capture-fullscreen` command */
  export type CaptureFullscreen = ExtensionPreferences & {
  /** Show Preview - Show preview after capture (if disabled, uses default action) */
  "showPreview": boolean,
  /** Default Action - Action to perform when preview is disabled */
  "defaultAction": "copy" | "save" | "both",
  /** Save Location - Where to save screenshots (overrides global setting) */
  "saveLocation"?: string
}
  /** Preferences accessible in the `capture-area-file` command */
  export type CaptureAreaFile = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-window-file` command */
  export type CaptureWindowFile = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-fullscreen-file` command */
  export type CaptureFullscreenFile = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-self-timer` command */
  export type CaptureSelfTimer = ExtensionPreferences & {
  /** Timer Delay - Countdown before capture */
  "timerDelay": "3" | "5" | "10",
  /** Show Preview - Show preview after capture (if disabled, uses default action) */
  "showPreview": boolean,
  /** Default Action - Action to perform when preview is disabled */
  "defaultAction": "copy" | "save" | "both",
  /** Save Location - Where to save screenshots (overrides global setting) */
  "saveLocation"?: string
}
  /** Preferences accessible in the `view-history` command */
  export type ViewHistory = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-preview` command */
  export type CapturePreview = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `capture-area` command */
  export type CaptureArea = {}
  /** Arguments passed to the `capture-window` command */
  export type CaptureWindow = {}
  /** Arguments passed to the `capture-fullscreen` command */
  export type CaptureFullscreen = {}
  /** Arguments passed to the `capture-area-file` command */
  export type CaptureAreaFile = {}
  /** Arguments passed to the `capture-window-file` command */
  export type CaptureWindowFile = {}
  /** Arguments passed to the `capture-fullscreen-file` command */
  export type CaptureFullscreenFile = {}
  /** Arguments passed to the `capture-self-timer` command */
  export type CaptureSelfTimer = {}
  /** Arguments passed to the `view-history` command */
  export type ViewHistory = {}
  /** Arguments passed to the `capture-preview` command */
  export type CapturePreview = {}
}

