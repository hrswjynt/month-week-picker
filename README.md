# 🗓️ Month & Week Picker for Firefox

A Firefox extension that adds native-like picker UIs for `<input type="month">` and `<input type="week">` — which Firefox doesn't support natively.

![Month Picker](https://raw.githubusercontent.com/user/month-week-picker/main/screenshots/month-picker.png)

## Features

- **Month picker** — clean grid of months with year navigation
- **Week picker** — full calendar view with ISO week numbers
- **Locale-aware display** — shows "February 2026" instead of "2026-02"
- **Placeholder support** — displays placeholder text when empty
- **Clear & Today buttons** — quick actions in the picker footer
- **Respects `disabled` & `readonly`** — won't open on restricted inputs
- **System colors** — adapts to OS light/dark theme and accent color
- **Shadow DOM isolation** — styles won't conflict with page CSS
- **Zero dependencies at runtime** — single bundled content script

## Install

### From Firefox Add-ons (AMO)

> Coming soon

### Manual / Development

1. Clone this repo
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open Firefox → `about:debugging` → **This Firefox** → **Load Temporary Add-on**
4. Select `dist/manifest.json`

## How It Works

The extension runs a content script on all pages that:

1. Detects `<input type="month">` and `<input type="week">` elements
2. Wraps each input with a calendar icon trigger
3. Overlays a formatted display (e.g. "February 2026") on top of the raw ISO value
4. Opens a Svelte-powered picker popup on click/focus
5. Sets the input value and dispatches `input`/`change` events on selection

The raw ISO value (`2026-02`, `2026-W07`) is preserved in `input.value` for form compatibility.

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Build to `dist/` |
| `npm run package` | Build + create `month-week-picker.zip` for AMO |
| `npm run watch` | Rebuild on file changes |

## Tech Stack

- **Svelte 5** — picker UI components
- **Vite** — bundling
- **CSS System Colors** — `AccentColor`, `Canvas`, `CanvasText`, `GrayText`
- **Manifest V3** — modern Firefox extension format

## Project Structure

```
src/
├── content.js          # Content script entry point
├── picker.css          # Picker styles (system colors)
└── lib/
    ├── PickerHost.svelte   # Popup container, positioning, footer
    ├── MonthPicker.svelte  # Month grid picker
    ├── WeekPicker.svelte   # Week calendar picker
    ├── registry.js         # Picker component registry
    └── utils.js            # Date parsing, formatting, helpers
icons/                  # Extension icons (48, 96, 128px)
manifest.json           # Extension manifest
test.html               # Test page with various scenarios
```

## License

MIT
