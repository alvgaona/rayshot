# Rayshot Features

## Implemented

### Capture Modes
- [x] Area capture - select a region of the screen
- [x] Window capture - capture a specific window
- [x] Fullscreen capture - capture the entire screen

### Output Options
- [x] Copy to clipboard
- [x] Save to file
- [x] Copy and save simultaneously

### Preview
- [x] Post-capture preview with image display
- [x] Metadata display (filename, type, size, capture time)
- [x] Action menu (Copy, Save, Copy and Save, Cancel)

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
- [x] Per-command show preview toggle
- [x] Per-command default action (copy/save/both)
- [x] Per-command save location override

## Planned

### Scrolling Capture
Capture content that extends beyond the visible screen.

**Approach:**
- User takes multiple overlapping screenshots while scrolling
- Use SIFT/ORB feature detection to find matching keypoints
- Compute homography between consecutive images
- Stitch and blend seamlessly

**Implementation:**
- Use `@techstark/opencv-js` (OpenCV WASM build) for feature detection and stitching
- `capture-scroll-start.ts` - begins collecting screenshots to temp folder
- `capture-scroll-finish.ts` - runs stitcher, outputs final image
- `stitcher.ts` - opencv.js stitching logic

### Annotation/Edit Window
Open captured screenshots in an editor for annotations.

**Options:**
- Open in Preview.app (simple, uses macOS Markup tools)
- Build custom Swift annotation app (CleanShot X-like experience)

### OCR Text Extraction
Extract text from screenshots using macOS Vision framework.

### Screen Recording
Record screen video with area selection.

### Quick Actions
- Pin screenshot to desktop
- Upload to cloud storage
- Share via system share sheet
