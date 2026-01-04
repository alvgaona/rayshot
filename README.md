# Rayshot

Screenshot utility for Raycast

## Features

- **Area Capture** - Select and capture a specific area of the screen
- **Window Capture** - Capture a specific window
- **Fullscreen Capture** - Capture the entire screen
- **Screenshot Preview** - Preview captures before saving with metadata display
- **Screenshot History** - Browse, copy, and manage all captured screenshots
- **Flexible Output** - Copy to clipboard, save to file, or both
- **Self-Timer Capture** - Dedicated command with countdown timer for capturing menus and tooltips
- **Custom Filenames** - Pattern-based filename generation with date, time, and mode variables
- **Per-Command Preferences** - Configure each capture type independently

## Commands

| Command                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| Capture Area               | Capture a selected area with preview          |
| Capture Window             | Capture a specific window with preview        |
| Capture Fullscreen         | Capture the entire screen with preview        |
| Capture Area to File       | Capture area and save directly to file        |
| Capture Window to File     | Capture window and save directly to file      |
| Capture Fullscreen to File | Capture fullscreen and save directly to file  |
| Self-Timer Capture         | Capture area with countdown (3s/5s/10s) delay |
| Screenshot History         | View and manage captured screenshots          |

## Preferences

### Global Preferences

- **Save Location** - Default directory for saving screenshots (default: `~/Pictures`)
- **Sound Effect** - Play capture sound when taking screenshots
- **Filename Pattern** - Customize screenshot filenames using variables:
  - `{mode}` - Capture mode (Area, Window, Fullscreen)
  - `{date}` - Date in YYYY-MM-DD format
  - `{time}` - Time in HH-MM-SS format
  - `{timestamp}` - Unix timestamp in milliseconds
  - Example: `Screenshot_{mode}_{date}_{time}` → `Screenshot_Area_2024-01-15_14-30-45.png`

### Per-Command Preferences

**Standard Capture Commands** (Area, Window, Fullscreen) can be configured with:

- **Show Preview** - Show preview after capture or perform default action immediately
- **Default Action** - Action to perform when preview is disabled (Copy, Save, or Both)
- **Save Location** - Override the global save location for this command

**Self-Timer Capture** preferences:

- **Timer Delay** - Countdown duration before capture (3s, 5s, or 10s)
  - **How it works**: Select area first, then countdown runs, then captures
  - Perfect for capturing menus, tooltips, hover states
  - Use the delay to set up the screen after selecting the area
  - Always shows preview after capture

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` to start development mode

### Publishing

Before publishing to the Raycast store:

1. Create a Raycast account at https://raycast.com
2. Update the `author` field in `package.json` with your Raycast username
3. Run `npm run publish`

## License

MIT License - see [LICENSE](LICENSE) for details.
