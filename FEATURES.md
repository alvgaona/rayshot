# Rayshot Features

## Implemented

### Capture Modes

- [x] Area capture - select a region of the screen
- [x] Window capture - capture a specific window
- [x] Fullscreen capture - capture the entire screen
- [x] Self-timer capture - countdown before area capture

### Output Options

- [x] Copy to clipboard
- [x] Save to file
- [x] Copy and save simultaneously
- [x] Multiple image formats (PNG, JPEG, WebP)
- [x] Configurable JPEG quality (75, 85, 90)
- [x] Configurable WebP quality (75, 85, 90)

### Preview

- [x] Post-capture preview with image display
- [x] Metadata display (filename, type, format, size, dimensions, capture date/time)
- [x] Action menu (Copy, Save, Copy and Save, Cancel)
- [x] Fallback to default action when preview fails

### History

- [x] Screenshot history with grid view
- [x] View captured screenshots
- [x] Copy to clipboard from history
- [x] Open in default app
- [x] Reveal in Finder
- [x] Delete individual screenshots
- [x] Clear all history

### Preferences

- [x] Global save location (default: ~/Pictures)
- [x] Sound effect toggle
- [x] Customizable filename pattern with variables ({mode}, {date}, {time}, {timestamp})
- [x] Image format selection (PNG/JPEG/WebP)
- [x] Format-specific quality settings
- [x] Per-command show preview toggle
- [x] Per-command default action (copy/save/both)
- [x] Per-command save location override
- [x] Self-timer delay options (3s, 5s, 10s)

## Planned Features

### Feasible within Raycast Extension

#### Cloud Upload Integration

- [ ] **Imgur Upload** - OAuth-based upload with auto-copy URL to clipboard and upload history tracking via Imgur API
- [ ] **Custom S3/Cloud Storage** - Configurable endpoint, bucket, credentials with signed URL generation for AWS S3, Cloudflare R2 using AWS SDK
- [ ] **Cloudflare Images** - Direct API integration with automatic optimization and variant generation
- [ ] **Share Links** - Track upload history, delete from cloud option, copy URL to clipboard

#### OCR (Text Recognition)

- [ ] **Extract Text via Swift Helper** - Create companion Swift CLI tool using VNRecognizeTextRequest from macOS Vision framework, called via child_process
- [ ] **Copy Extracted Text** - Parse Swift helper output, format with line breaks, copy to clipboard
- [ ] **Search History by Text** - Store OCR results in metadata JSON, full-text search across screenshots, highlight matches in history

#### Improved History

- [ ] **Search & Filter** - Filter by date range, capture type, format, filename search, OCR text search
- [ ] **Bulk Operations** - Multi-select with checkboxes, bulk delete/export/upload
- [ ] **Tags & Categories** - Custom tags stored in metadata, folders, tag filtering
- [ ] **Thumbnails Grid View** - Lazy loading, hover preview using base64 thumbnails, multi-sort options

#### Quick Actions in Preview

- [ ] **Open in External Editor** - Launch Preview.app, Photoshop, Pixelmator, or other configured apps via `open` command
- [ ] **Share via AppleScript** - Use AppleScript to trigger system share sheet or specific sharing services
- [ ] **Quick Upload** - One-click cloud upload with progress indicator and auto-copy URL

#### Statistics Dashboard

- [ ] **Usage Analytics** - Total screenshots from metadata, storage usage via fs.statSync, format/mode statistics from history
- [ ] **Storage Management** - Disk space monitoring, large file identification, auto-cleanup with retention policies

#### Keyboard Shortcut Customization

- [ ] **Per-Command Shortcuts** - Raycast allows configuring shortcuts in package.json and preferences

#### Templates/Presets

- [ ] **Settings Profiles** - Store named presets in LocalStorage or support directory, quick switcher command, import/export JSON

#### Additional Enhancements

- [ ] **Multi-Monitor Support** - Use screencapture with display ID flag for specific monitor selection
- [ ] **Delay/Timer Options** - Extend existing self-timer with custom delays (1-60s), countdown HUD display
- [ ] **Clipboard History Integration** - Work with Raycast's built-in clipboard history

### Requires Standalone Swift Application

> **Note:** These features require building a separate macOS application because Raycast extensions run in a sandboxed Node.js environment without access to AppKit, SwiftUI, or advanced system APIs.

#### Image Editing / Annotation

- [ ] **Annotation Tools** - Requires native UI for drawing arrows, text, shapes, highlights
  - **Why:** Need AppKit/SwiftUI for interactive canvas with real-time rendering
  - **Approach:** Build standalone Swift app, launch from Raycast extension via `open` command
- [ ] **Crop & Resize** - Interactive crop handles with live preview
  - **Why:** Requires native UI with mouse tracking and visual feedback
  - **Approach:** Swift app with NSImage manipulation
- [ ] **Blur/Pixelate Tool** - Brush-based redaction
  - **Why:** Needs real-time canvas interaction and Core Image filters
  - **Approach:** Swift app using CIFilter (CIGaussianBlur, CIPixellate)
- [ ] **Highlight Tool** - Semi-transparent overlays
  - **Why:** Interactive drawing layer
  - **Approach:** Swift app with Core Graphics

#### Pin to Screen

- [ ] **Floating Screenshot Window** - Always-on-top overlay
  - **Why:** Requires NSWindow with custom level, mouse events, window management
  - **Approach:** Standalone Swift app with NSPanel at .floating level

#### Video/GIF Recording

- [ ] **Screen Recording to MP4** - Record screen with area selection
  - **Why:** Requires AVFoundation (AVCaptureScreenInput, AVAssetWriter) which isn't available in Node.js
  - **Approach:** Swift app using AVFoundation for recording, communicate with extension via IPC
- [ ] **GIF Export** - Convert recordings to GIF
  - **Why:** Heavy processing, needs ffmpeg or ImageIO
  - **Approach:** Swift app using ffmpeg CLI or ImageIO framework
- [ ] **Recording Controls** - Menu bar indicator, overlay controls
  - **Why:** Needs NSStatusItem, custom windows
  - **Approach:** Swift app with menu bar extra

#### Scrolling Capture (Image Stitching)

- [ ] **Long Screenshot Stitching** - Stitch multiple screenshots seamlessly
  - **Why:** While OpenCV.js could theoretically run in Node.js, it's heavy and slow. Native Vision framework or Core Image is faster
  - **Approach:** Swift CLI tool using Vision framework VNImageHomographicAlignmentObservation for feature matching, or Core Image for perspective transforms
- [ ] **Auto-scroll Mode** - Automatic scrolling and capture
  - **Why:** Requires Accessibility API (AXUIElement) for scrolling control
  - **Approach:** Swift app with Accessibility permissions

#### Advanced Features

- [ ] **Watermark Support** - Add text/image watermark
  - **Why:** Real-time preview needed for positioning
  - **Approach:** Swift app with Core Graphics/Core Image
- [ ] **Border & Shadow Effects** - Visual enhancements
  - **Why:** Best done with Core Graphics NSShadow and layer effects
  - **Approach:** Swift app or could use sips CLI for simple borders
- [ ] **Color Picker** - Eyedropper from screenshot
  - **Why:** Needs mouse tracking on image canvas
  - **Approach:** Swift app with NSColorSampler or custom picker

## Hybrid Architecture Proposal

To maximize Rayshot's potential while working within Raycast's constraints:

### Option 1: Raycast Extension + Swift Helper CLIs

- **Extension handles:** Capture, format conversion (via sips), cloud upload, history, OCR text (via Swift CLI), basic actions
- **Swift CLI tools:** Stateless command-line tools for specific tasks (OCR text extraction, image stitching)
- **Pros:** Works within Raycast, no separate app to maintain
- **Cons:** No interactive editing, limited to batch operations

### Option 2: Raycast Extension + Standalone Swift App

- **Extension handles:** Capture triggering, history, cloud upload, launching companion app
- **Swift App handles:** Annotation, editing, pin-to-screen, recording, stitching with UI
- **Communication:** Extension launches app with file path, app saves result, extension imports back
- **Pros:** Full feature set, native performance, rich UI
- **Cons:** More complex distribution, two apps to maintain

### Option 3: Pure Swift macOS App (No Raycast)

- **Approach:** Build standalone app with all features natively
- **Pros:** No limitations, full control, best performance
- **Cons:** Loses Raycast integration, launcher benefits, settings sync

## Recommended Roadmap

### Phase 1: Maximize Raycast Extension (Current)

- [x] Core capture modes
- [x] Format support
- [x] History & preview
- [ ] Cloud upload integration
- [ ] OCR via Swift CLI helper
- [ ] Enhanced history (search, tags, filters)
- [ ] Statistics dashboard

### Phase 2: Swift CLI Helpers (No UI)

- [ ] OCR text extraction tool (`rayshot-ocr`)
- [ ] Image stitching tool (`rayshot-stitch`)
- [ ] Watermark CLI tool (`rayshot-watermark`)
- [ ] Extension calls these via child_process.exec()

### Phase 3: Evaluate Standalone App

- [ ] Prototype Swift app for editing/annotation
- [ ] Decide if maintaining separate app is worth it
- [ ] If yes: Build companion app that integrates with extension
- [ ] If no: Recommend external tools (Preview.app, Pixelmator)

## Technical Constraints

### What Raycast Extensions CAN Do:

- ✅ Run Node.js code (child_process, fs, path, etc.)
- ✅ Call system commands via exec/spawn
- ✅ Use sips, screencapture, osascript, open
- ✅ HTTP requests for cloud APIs
- ✅ Read/write files in support directory
- ✅ Show UI with Raycast's React components
- ✅ Access clipboard via Raycast API

### What Raycast Extensions CANNOT Do:

- ❌ Create custom windows or overlays
- ❌ Access AppKit/SwiftUI directly
- ❌ Use AVFoundation for recording
- ❌ Draw on screen with interactive tools
- ❌ Create menu bar extras
- ❌ Use native image editing UI
- ❌ Access Accessibility APIs directly
- ❌ Show always-on-top floating windows
