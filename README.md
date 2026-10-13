# AE Element Vault

AE Element Vault is an Adobe After Effects CEP (Common Extensibility Platform) extension for cataloging, previewing, and inserting reusable motion-design compositions and project assets.

The extension inspects compositions from open After Effects projects or external `.aep` files, isolates their dependencies into standalone project files, generates preview frames and midpoint thumbnails, exposes customizable parameters (text layers, expression controls, and Essential Properties), and inserts assets into the active composition at the current playhead with configurable scaling and positioning.

The frontend is built with React 18, TypeScript, and Tailwind CSS, running in the Chromium Embedded Framework (CEF) with Node.js integration enabled. It communicates via Adobe CSInterface with pure ECMAScript 3 (ES3) ExtendScript modules executed by the After Effects host scripting engine.

## Features

- **Project Scanning and Asset Extraction**: Discovers compositions in the active project or external `.aep` files, extracts structural metadata (dimensions, duration, frame rate, layer count, audio presence), isolates dependencies via `app.project.reduceProject()`, and exports standalone `.aep` files to the local library.
- **Thumbnail and Hover-Scrub Previews**: Captures midpoint PNG thumbnails (`duration / 2`) via `comp.saveFrameToPng()`. Renders multi-frame image sequences across composition durations for cursor-tracked hover scrubbing in the catalog grid.
- **Parameter Inspection**: Inspects exposed Essential Properties (Master Properties) using a scratch precomposition, traverses text layer hierarchies to extract Source Text typography (font, size, tracking, justification, fill color), and discovers Expression Controls (Sliders, Colors, Checkboxes, Angles).
- **Customization Inspector**: Slide-over drawer with a 16:9 canvas preview, brand color palette selectors, typography badges, and slider controls. Allows saving and loading parameter configurations as named presets stored in the local library database.
- **Timeline Insertion and Retargeting**: Imports standalone `.aep` assets into the active composition at the current playhead. Supports scaling modes (`auto`, `fit-width`, `fill`, `original`), position anchoring (`center`, `lower-third`, `top-third`), frame-rate conformation, and single-step undo via `app.beginUndoGroup()`.
- **Parameter Synchronization**: Propagates modified parameters directly to the currently selected layer in the active timeline across Essential Properties, Effect controls, and Source Text without re-importing the asset.
- **Asset Catalog Grid**: Categorized browsing (Titles, Lower Thirds, Transitions, Social, Essential Graphics, Favorites), instant search with the `/` shortcut, and density switching between Comfortable (16:9 cards) and Compact views.

## Requirements and Compatibility

- **Host Application**: Adobe After Effects CC 2019 (16.0) through AE 2025 (25.9), as declared in [CSXS/manifest.xml](CSXS/manifest.xml).
- **CEP Runtime**: CSXS 9.0 through 16.0.
- **Operating System**: Windows 10/11 or macOS 10.15+.
- **Node.js**: Node.js 18 or later with npm (required for building, testing, and packaging).

## Installation

The extension can be installed either by building from source or from a pre-packaged release archive.

### Method 1: Installing from Source

When installing from source, the frontend must be compiled before launching After Effects because the extension manifest targets `./dist/index.html`.

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Compile the production bundle:
   ```bash
   npm run build
   ```

3. Deploy the extension link:

   **Windows:**
   Run [install.bat](install.bat) from Command Prompt or by double-clicking it in File Explorer. The script:
   - Sets `PlayerDebugMode` to `1` in the Windows Registry under `HKCU\Software\Adobe\CSXS.[9-16]`.
   - Creates a directory junction from the repository root to `%APPDATA%\Adobe\CEP\extensions\ae-element-vault`.

   **macOS:**
   Make the install script executable and run it in Terminal:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   The script:
   - Sets `PlayerDebugMode` to `1` in macOS user preferences (`defaults write com.adobe.CSXS.[9-16] PlayerDebugMode 1`).
   - Creates a symbolic link from the repository root to `~/Library/Application Support/Adobe/CEP/extensions/ae-element-vault`.

### Method 2: Installing from a Release Package

Packaged release archives (`release/ae-element-vault-v1.0.0.zip`) already contain the compiled `dist/` bundle.

1. Extract the release archive to a persistent folder on your local drive.
2. Run [install.bat](install.bat) (Windows) or [install.sh](install.sh) (macOS) from the extracted folder.

### PlayerDebugMode Note

Both install scripts set `PlayerDebugMode=1`. This is an Adobe CEP developer setting that permits unsigned extensions to run locally without a cryptographically signed `.zxp` certificate package. It modifies user-level preferences only (`HKCU\Software\Adobe\CSXS.[9-16]` on Windows or `com.adobe.CSXS.[9-16]` on macOS) and does not modify system-wide security policies.

### Launching the Extension

1. Launch or restart Adobe After Effects.
2. Open the extension from the main menu: **Window > Extensions > AE Element Vault**.
3. Dock the panel into your After Effects workspace.

### Uninstallation

To remove the extension link from Adobe After Effects:

- **Windows**: Run [uninstall.bat](uninstall.bat). This removes the directory junction at `%APPDATA%\Adobe\CEP\extensions\ae-element-vault` without altering repository files.
- **macOS**: Run [uninstall.sh](uninstall.sh). This removes the symbolic link at `~/Library/Application Support/Adobe/CEP/extensions/ae-element-vault`.

Local library data stored in your user profile directory (`%APPDATA%\ElementVault` on Windows or `~/Library/Application Support/ElementVault` on macOS) is preserved after uninstallation.

## Basic Usage

### 1. Dissecting Projects and Adding Assets

1. In the panel header, select **Project Dissector**.
2. Drop an `.aep` project file into the dropzone, click **Browse Files**, or click **Dissect Open AE Project** to scan the currently active project.
3. The multi-stage pipeline scans compositions, displays metadata (resolution, duration, frame rate, layer count), and lets you inspect dependencies.
4. Click **Export** on any composition to isolate its dependencies using `reduceProject` and save a standalone `.aep` file into the local library.

### 2. Browsing and Previewing Assets

1. In the panel header, switch to **Library Catalog**.
2. Filter items by category tabs (**All**, **Titles**, **Lower Thirds**, **Transitions**, **Social**, **Essential Graphics**, **Favorites**) or use the search bar (press `/` to focus).
3. Move your cursor horizontally across any asset card thumbnail to scrub through its multi-frame preview sequence.
4. Use the density buttons in the search toolbar to switch between Comfortable (large 16:9 cards) and Compact layouts.

### 3. Customizing Parameters

1. Click **Customize** on any card to open the slide-over inspector drawer.
2. If the asset exposes Essential Properties, they appear under the **Essential Properties** tab.
3. Edit typography under the **Typography** tab, change colors under **Brand Colors**, or adjust sliders and toggles under **Controls**.
4. The live canvas preview at the top of the drawer updates as values change.
5. Save reusable parameter configurations using the preset manager in the drawer.

### 4. Inserting into the Timeline

1. In After Effects, open a target composition in the Timeline viewer and place the playhead at the desired start time.
2. Configure insertion options in the inspector drawer:
   - **Scale Mode**: `auto` (scales uniformly to fit the comp dimensions), `fit-width`, `fill`, or `original`.
   - **Position**: `center`, `lower-third` (anchors to title-safe lower-third margins), or `top-third`.
   - **Match FPS**: Conforms the imported comp's frame rate to match the active comp.
3. Click **Insert** on the card or in the inspector footer.
4. The element is imported into the project, placed at the playhead, and wrapped in an undo group (`Ctrl+Z` / `Cmd+Z`).

### 5. Synchronizing Parameters to an Existing Timeline Layer

1. Select a layer in your active After Effects timeline.
2. Adjust the desired parameters in the inspector drawer.
3. Click **Sync to Selected Timeline Layer**.
4. The host engine updates matching Essential Properties, Effect controls, and Source Text values on the selected layer without re-importing the file.

### Keyboard Shortcuts

| Shortcut | Scope | Action |
|---|---|---|
| `/` or `Ctrl+F` / `Cmd+F` | Library Catalog | Focuses and selects the search input. |
| `Esc` | Inspector / Modals | Closes the parameter inspector drawer or dismisses open modals. |
| `Ctrl+Z` / `Cmd+Z` | After Effects Timeline | Reverts element insertion or parameter updates via After Effects undo group. |

## Development Setup

### Local Development in Browser Mock Mode

The panel can be run outside After Effects in a standard web browser for UI development. When `window.__adobe_cep__` is not detected, the CEP bridge ([src/lib/cepBridge.ts](src/lib/cepBridge.ts)) automatically falls back to mock responses and browser `localStorage`.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in any modern web browser.

### Remote Debugging Inside After Effects

The repository includes a [.debug](.debug) configuration file exposing port `8088` for the panel.

1. Ensure [install.bat](install.bat) or [install.sh](install.sh) has been run and the extension is opened inside After Effects.
2. Open a Chromium-based browser (Google Chrome or Microsoft Edge).
3. Navigate to `http://localhost:8088`.
4. Click on the extension page target to inspect DOM elements, view console output, and set breakpoints.

## Build, Validation, Testing, and Packaging

Available scripts in [package.json](package.json):

| Command | Action |
|---|---|
| `npm run dev` | Starts the Vite local development server on port 5173 with HMR. |
| `npm run build` | Runs TypeScript compilation (`tsc`) and Vite production bundling. Copies `CSXS/`, `host/`, and `.debug` into `dist/`. |
| `npm run validate` | Runs `scripts/validate-bundle.mjs` to verify bundle completeness and ES3 syntax compliance in host scripts. |
| `npm run build:prod` | Executes `tsc && vite build && node scripts/validate-bundle.mjs`. |
| `npm run package` | Runs `build:prod` and `scripts/package-extension.mjs`, creating `release/ae-element-vault-v1.0.0.zip`. |
| `npm run preview` | Starts the Vite preview server for the compiled `dist/` directory on port 4173. |

### Validation Script (`scripts/validate-bundle.mjs`)

The validator ([scripts/validate-bundle.mjs](scripts/validate-bundle.mjs)) performs the following automated checks:
1. **CEP Manifest**: Verifies presence of `CSXS/manifest.xml`, bundle ID (`com.vault.aeelementvault`), host target (`AEFT`), entry points (`./dist/index.html`, `./host/index.jsx`).
2. **Debug Configuration**: Verifies `.debug` port configuration (8088).
3. **Distribution Build**: Confirms `dist/index.html` exists and `dist/assets/` contains compiled `.js` and `.css` files.
4. **Host Modules**: Verifies all 11 host `.jsx` scripts exist in `dist/host/`.
5. **ES3 Syntax Compliance**: Scans all host scripts line-by-line for tokens disallowed in ExtendScript ES3 (`const`, `let`, arrow functions `=>`, backtick template literals).

### End-to-End Regression Test Suite

An automated end-to-end regression test script is provided in [scratch/test_e2e_master.mjs](scratch/test_e2e_master.mjs).

To run the test suite:
```bash
node --experimental-websocket scratch/test_e2e_master.mjs
```

The script runs headlessly and does not require After Effects to be open:
1. Validates manifest, host scripts, ES3 syntax, and install/uninstall scripts on disk.
2. Starts a Vite preview server and launches headless Chromium via Chrome DevTools Protocol (CDP).
3. Evaluates panel mounting, view switching, file dropzone interaction, ingestion progress modal, composition scanning, library database operations, grid density toggles, search filtering, inspector drawer controls, retargeting calculations, timeline insertion simulation, and parameter synchronization.
4. Shuts down the test preview server and headless browser upon completion.

## Architecture Overview

AE Element Vault separates its responsibilities across three primary layers: the CEF frontend, the ExtendScript host engine, and local filesystem storage.

### 1. Frontend Layer (CEF)
- Built with React 18, TypeScript, and Tailwind CSS v4, running inside Chromium Embedded Framework.
- Hosted within After Effects as a dockable panel (`com.vault.aeelementvault.panel`).
- Node.js integration is enabled via `--enable-nodejs` and `--mixed-context` command-line flags in [CSXS/manifest.xml](CSXS/manifest.xml), allowing direct access to Node.js APIs (`fs`, `path`, `os`) via `window.cep_node`.

### 2. ExtendScript Host Engine
- Implemented in pure ECMAScript 3 (ES3) in [host/](host/) and executed by the After Effects C++ scripting engine.
- [host/index.jsx](host/index.jsx): Main namespace entry point (`ElementVault`), error formatting (`formatSuccess`, `formatError`), and module loader.
- [host/scanner.jsx](host/scanner.jsx): Scans composition trees, dimensions, durations, frame rates, layer counts, and audio flags.
- [host/reducer.jsx](host/reducer.jsx): Isolates compositions and deletes unreferenced project items via `app.project.reduceProject()`.
- [host/exporter.jsx](host/exporter.jsx): Clones projects to temporary disk paths, reduces composition dependencies, and saves isolated `.aep` files.
- [host/thumbnail.jsx](host/thumbnail.jsx): Midpoint PNG frame capture via `comp.saveFrameToPng()`.
- [host/previewRenderer.jsx](host/previewRenderer.jsx): Multi-frame sequential rendering for hover-scrub previews.
- [host/textInspector.jsx](host/textInspector.jsx): Text layer discovery and typography extraction (font family, font size, tracking, justification, fill color).
- [host/controlsInspector.jsx](host/controlsInspector.jsx): Discovers Expression Controls (Slider, Color, Checkbox, Angle) across composition layers.
- [host/essentialProps.jsx](host/essentialProps.jsx): Discovers exposed Essential Properties using a temporary scratch precomposition.
- [host/inserter.jsx](host/inserter.jsx): Imports `.aep` files into the active composition, sets playhead timing, applies scaling (`auto`, `fit-width`, `fill`), anchors position, and matches frame rates under an undo group.
- [host/syncEngine.jsx](host/syncEngine.jsx): Updates Essential Properties, Effect controls, and Source Text on selected timeline layers.

### 3. Bridge Communication Layer
- Managed by [src/lib/cepBridge.ts](src/lib/cepBridge.ts) via Adobe's `CSInterface.evalScript()`.
- Serializes UI action payloads to JSON strings, evaluates the corresponding `ElementVault.<method>()` function, and parses returned JSON results into asynchronous TypeScript Promises.
- Falls back to browser `localStorage` and simulated responses when running in standard web browsers outside After Effects.

### 4. Local Library Storage
Managed by [src/lib/storageService.ts](src/lib/storageService.ts). Persists library items and parameter presets directly to the user's application data directory:
- **Windows**: `%APPDATA%\ElementVault\Library`
- **macOS**: `~/Library/Application Support/ElementVault/Library`

The storage directory structure:
- `database.json`: JSON catalog index containing item metadata, categories, tags, and saved parameter presets.
- `assets/`: Standalone `.aep` project files isolated during project scanning.
- `previews/`: PNG thumbnails and frame sequences generated for hover scrubbing.

## Known Limitations and Troubleshooting

- **Blank or white panel on initial launch**: Occurs if `npm run build` was not executed before opening the panel in After Effects. When installed via directory junction or symlink, After Effects looks for `./dist/index.html`. If the file does not exist, compile the project with `npm run build` and reload the panel.
- **Node.js filesystem calls fail**: Ensure the CEF command-line parameters `--enable-nodejs` and `--mixed-context` are present in [CSXS/manifest.xml](CSXS/manifest.xml). If running outside After Effects in a standard browser, the panel automatically falls back to `localStorage`.
- **Exporting unsaved projects**: The composition exporter ([host/exporter.jsx](host/exporter.jsx)) duplicates the project file on disk before running `reduceProject`. If the currently active project has never been saved to disk (`Untitled Project`), export will fail with an error prompting you to save the project first.
- **UI pause during batch operations**: ExtendScript executes synchronously on the After Effects main application thread. Operations such as multi-frame preview rendering (`saveFrameToPng`) or batch project reduction may briefly pause the After Effects interface until complete.
- **Panel not visible in Window > Extensions**: Verify that `PlayerDebugMode` is set to `1` in the registry (`HKCU\Software\Adobe\CSXS.[version]`) or macOS preferences (`com.adobe.CSXS.[version]`). Check that the directory junction or symlink in the Adobe CEP extensions folder points to the correct repository path.

## License

This repository is marked as private in [package.json](package.json) and does not currently include a standalone open-source license file. All rights are reserved by the original authors.
