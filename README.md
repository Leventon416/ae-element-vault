# AE Element Vault — Adobe After Effects CEP Extension

[![Adobe After Effects](https://img.shields.io/badge/Adobe%20After%20Effects-CC%202019%20--%202026+-9999FF?logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![CEP Runtime](https://img.shields.io/badge/CEP-9.0%20--%2016.0-1473E6)](https://github.com/Adobe-CEP)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**AE Element Vault** is an enterprise-grade Adobe After Effects CEP (Common Extensibility Platform) panel extension that transforms complex motion design projects into modular, reusable, and parameter-customizable element libraries.

Drop any `.aep` project file into Element Vault to automatically dissect its compositions, isolate dependencies non-destructively, generate animated hover-scrub previews, inspect and expose Essential Properties (Master Properties), and insert elements onto the After Effects timeline with smart mathematical retargeting and parameter synchronization.

---

## Key Features

### 1. Automated Multi-Stage Project Dissector
- **Drag-and-Drop Ingestion:** Drag any `.aep` file directly into the dropzone or dissect the currently active After Effects workspace with a single click.
- **Dependency Tree Isolation:** Trims unused assets and precomps non-destructively using `reduceProject([targetComp])` inside an isolated temporary sandbox.
- **Standalone `.aep` Export:** Saves clean, lightweight `.aep` asset files to your local Element Vault library while keeping your active After Effects project 100% untouched.

### 2. Kinetic 16:9 Hover-Scrubbing Previews
- **Instant Visual Scrubbing:** Scrub across 10 equidistant sample frames merely by moving your mouse horizontally across any asset card.
- **Smart Midpoint Thumbnails:** Automatically calculates `duration / 2` to capture meaningful visual states instead of blank or transparent frame zeros.
- **Smooth Playback:** 60fps cursor-tracked frame interpolation with responsive duration and audio indicator pills.

### 3. Essential Properties (Master Properties) Extraction
- **Curated Property Prioritization:** Extracts exposed Master Properties from the Essential Graphics panel via non-destructive scratch precomp inspection (`ADBE Essential Properties`).
- **Comprehensive Fallbacks:** Intelligently discovers Source Text typography layers and Expression Controls (Sliders, Colors, Angles, Checkboxes).

### 4. Live Parameter Customization Inspector
- **Slide-Over Parameter Drawer:** Live parameter editing drawer with immediate feedback rendered on a 16:9 canvas.
- **Brand Color Palettes:** One-click application of brand palettes (Adobe Blue, Crimson, Amber, Emerald, Obsidian).
- **Preset Management:** Save, load, duplicate, and delete parameter presets directly to disk as JSON.

### 5. Smart Retargeting & Timeline Insertion
- **Mathematical Scaling:** Automatically scales imported graphics (1080p to 4K, 4K to 1080p, 1:1 Square, 9:16 Vertical) using `auto`, `fit-width`, `fill`, or `original` scale modes.
- **Anchor Pinning:** Automatically snaps lower thirds to the lower-third title-safe margin or title cards to exact center.
- **Framerate Conformation:** Adapts compositions to match timeline FPS.
- **Single-Click Undo:** Wraps timeline placement in `app.beginUndoGroup("Element Vault - Insert Element")`.
- **Parameter Synchronization:** Synchronize modified parameters directly to the currently selected timeline layer with `#sync-selected-layer-btn`.

---

## One-Click Automated Installation

### Windows Installation

1. Clone or extract the repository:
   ```cmd
   git clone https://github.com/your-org/ae-element-vault.git
   cd ae-element-vault
   ```
2. Double-click `install.bat` (or run it in Command Prompt / PowerShell):
   - Automatically enables `PlayerDebugMode` in the Windows Registry for CSXS 9 through 16:
     ```cmd
     reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
     ```
   - Creates the extension junction pointing directly to your working directory:
     ```cmd
     mklink /J "%APPDATA%\Adobe\CEP\extensions\ae-element-vault" "%~dp0"
     ```
3. Launch Adobe After Effects and open:
   `Window > Extensions > Element Vault` (or `AE Element Vault`).

### macOS Installation

1. Open Terminal in the project directory:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   - Configures `PlayerDebugMode` in macOS preferences for CSXS versions:
     ```bash
     defaults write com.adobe.CSXS.9 PlayerDebugMode 1
     defaults write com.adobe.CSXS.10 PlayerDebugMode 1
     defaults write com.adobe.CSXS.11 PlayerDebugMode 1
     defaults write com.adobe.CSXS.12 PlayerDebugMode 1
     ```
   - Creates a symbolic link in:
     `~/Library/Application Support/Adobe/CEP/extensions/ae-element-vault`
2. Launch Adobe After Effects and open:
   `Window > Extensions > Element Vault`.

### Uninstallation

- **Windows:** Run `uninstall.bat` to safely remove the directory junction from `%APPDATA%\Adobe\CEP\extensions\` without touching any project files.
- **macOS:** Run `./uninstall.sh` to remove the symlink.

---

## Usage Walkthrough

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    PROJECT DISSECTOR                        │
  │   [Drop .aep Project]  ──>  Scan Comps  ──>  Isolate Tree   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                     LIBRARY CATALOG                         │
  │   • Comfortable / Compact Grid                              │
  │   • Hover-Scrub Frame Sequences                             │
  │   • Category Tabs & Instant Search                          │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 CUSTOMIZATION INSPECTOR                     │
  │   • Essential Properties     • Color Palettes               │
  │   • Typography & Font Size   • Sliders & Toggles            │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              TIMELINE INSERTION & RETARGETING               │
  │   • Smart Resolution Scaling (1080p ──> 4K)                 │
  │   • Lower-Third Title-Safe Placement                        │
  │   • Live Parameter Sync to Selected Timeline Layer          │
  └─────────────────────────────────────────────────────────────┘
```

1. **Dissect a Project:**
   - Click **Project Dissector** in the header.
   - Drag and drop any `.aep` file or click **Dissect Open AE Project**.
   - Watch the 6-stage pipeline scan, isolate, export `.aep` assets, and generate hover sequences.
2. **Browse & Filter:**
   - Switch back to **Library Catalog**.
   - Use category tabs (**Titles**, **Lower Thirds**, **Transitions**, **Social**, **Favorites**) or press `/` to instantly search.
   - Hover your mouse across any thumbnail to scrub through the animation frames.
3. **Customize Parameters:**
   - Click **Customize** on any card to slide open the Inspector drawer.
   - Modify text headlines, tweak brand colors, or adjust numeric sliders.
   - Notice the live 16:9 preview canvas updating dynamically.
4. **Insert into Active Composition:**
   - Open a composition in After Effects and position the playhead.
   - Click **Insert** on the card or in the Inspector footer.
   - Element Vault imports the standalone asset, matches aspect ratio and FPS, pins to the proper screen location, and groups the entire operation into a single undo step (`Ctrl+Z` / `Cmd+Z`).
5. **Sync to Existing Timeline Layer:**
   - Select an existing inserted layer on your After Effects timeline.
   - Click **Sync to Selected Timeline Layer** (`#sync-selected-layer-btn`) in the Inspector to apply your modified parameters instantly without re-importing!

---

## Architecture Overview

AE Element Vault uses a dual-engine architecture separating modern Chromium UI from After Effects' native ExtendScript C++ engine:

| Layer | Technology | Responsibilities |
|---|---|---|
| **Frontend Panel** | React 18, TypeScript, Tailwind CSS v4, Lucide Icons | Responsive UI, state management, hover scrubbing, preset saving, search & filters. |
| **CEP Bridge** | CSInterface, Node.js CEF Integration | Bi-directional communication between Chromium DOM and ExtendScript runtime. |
| **ExtendScript Engine** | Pure ECMAScript 3 (ES3) | Project traversal, composition scanning, `reduceProject`, `saveFrameToPng`, timeline insertion, Essential Properties, and parameter sync. |
| **Storage Service** | Node.js `fs` / `path` with `localStorage` fallback | Cross-platform JSON library database schema, automatic migrations, and preview sequence storage. |

### ExtendScript Host Modules (`host/` & `dist/host/`):

1. **`index.jsx`**: Master host entry point, namespace setup, error formatting, and modular `@include` loaders.
2. **`scanner.jsx`**: Recursively scans compositions, extracting resolution, duration, FPS, and layer metadata.
3. **`reducer.jsx`**: Analyzes dependency trees and executes non-destructive project reduction.
4. **`exporter.jsx`**: Clones projects into temporary workspaces and exports standalone `.aep` packages.
5. **`thumbnail.jsx`**: Captures midpoint transparent 16:9 PNG thumbnails via `comp.saveFrameToPng()`.
6. **`previewRenderer.jsx`**: Renders 10 equidistant preview sequence frames for fluid hover scrubbing.
7. **`textInspector.jsx`**: Traverses layer hierarchies and extracts editable typography and Source Text properties.
8. **`controlsInspector.jsx`**: Discovers Expression Controls (Sliders, Colors, Checkboxes, Angles).
9. **`essentialProps.jsx`**: Utilizes scratch precomps to extract exposed Essential Properties.
10. **`inserter.jsx`**: Imports `.aep` files at timeline playheads with smart retargeting math and undo grouping.
11. **`syncEngine.jsx`**: Propagates modified parameters to active timeline layers across Essential Properties, Effects, and Text.

---

## Keyboard Shortcuts Cheat Sheet

| Shortcut | Context | Action |
|---|---|---|
| `/` or `Ctrl + F` / `Cmd + F` | Anywhere in Catalog | Focus and select search bar input immediately |
| `Esc` | Inspector Drawer / Modals | Close parameter inspector or dismiss active modal |
| `Space` | Focused Card | Toggle hover-scrub playback simulation |
| `Enter` | Focused Card | Insert element at current playhead |
| `Ctrl + Z` / `Cmd + Z` | Inside After Effects | Undo element insertion or parameter sync in a single step |

---

## Production Build & Verification

```bash
# Install dependencies
npm install

# Start local development server with HMR
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Validate bundle integrity and ES3 compliance
npm run validate

# Production build + bundle validation
npm run build:prod

# Compile production package into release zip (./release/ae-element-vault-v1.0.0.zip)
npm run package

# Run the 20-module end-to-end regression master suite
node --experimental-websocket scratch/test_e2e_master.mjs
```

---

## Remote Debugging
When the extension is running inside Adobe After Effects:
1. Open any Chromium browser (Google Chrome or Microsoft Edge).
2. Navigate to `http://localhost:8088`.
3. Inspect DOM elements, network activity, storage, and console logs live.

---

## License
MIT License. Created for professional Adobe After Effects motion designers and studio workflows.
