# Modernization Inventory

## Purpose

This is the Phase 0 inventory for the current Electron app runtime.
It documents the highest-risk modernization surfaces before architectural changes begin.

## Current Supported Dev Environment

- Node.js `14.16.1`
- npm `6.14.12`
- Electron `12.0.2`
- React `17`
- Webpack `5`
- Python `2.7.16` noted in setup docs for older native builds
- macOS: Xcode installed
- Windows: Visual Studio 2019 plus `windows-build-tools`

Primary references:
- `README.md`
- `package.json`
- `AGENTS.md`

## Startup And Bootstrap Surfaces

These files define the current runtime boundary and boot order.

| Surface | Role | Why it matters |
| --- | --- | --- |
| `main.js` | Electron main entrypoint | Creates the BrowserWindow and still enables `enableRemoteModule: true`, `nodeIntegration: true`, and `contextIsolation: false` in `main.js:266-270`. Also seeds main-process globals. |
| `src/globals/NativeBridge.js` | Renderer-native bridge | Main choke point for `remote`, renderer IPC, dialog access, window access, power APIs, menu APIs, and `remote.getGlobal`. |
| `src/index.js` | First renderer bootstrap | Installs renderer globals such as `DBManager`, connectivity classes, and boot flags before render starts. |
| `src/main.js` | Renderer app bootstrap | Builds the Redux store, initializes managers, reads main globals through `NativeLinker`, and renders the app. |
| `src/components/App.js` | UI/runtime glue | Creates `global.redirect`, `global.updateState`, and `global.getState`, starts device bootstrap, and subscribes to store-update events. |
| `scripts/DBBridgeRender.js` | Renderer DB/export bridge | Uses `remote.app`, `remote.getGlobal`, `ipcRenderer`, and the GL worker. |
| `scripts/DBBridgeMain.js` | Main DB/cloud bridge | Central `ipcMain` endpoint for DB, cloud sync, and migration flows. |
| `auto-updater.js` | Updater IPC surface | Owns update-related channels and main-process update flags. |

## Electron `remote` Inventory

Direct `remote` usage is concentrated enough to be an early migration target.

What `remote` means here:
- `remote` lets renderer code directly access main-process APIs and objects.
- That is convenient in legacy Electron apps, but it weakens the renderer/main boundary and makes upgrades harder.
- In modern Electron, the preferred model is `preload` plus explicit IPC, where the renderer asks for a narrow capability instead of directly using privileged APIs.

| File | Surface | Purpose |
| --- | --- | --- |
| `src/globals/NativeBridge.js` | `remote.powerMonitor` | Suspend, resume, lock, and unlock observers. |
| `src/globals/NativeBridge.js` | `remote.getCurrentWindow()` | Window lifecycle, maximize, reload, parent lookup, popup host. |
| `src/globals/NativeBridge.js` | `remote.app` | `quit()` and `getPath("downloads")`. |
| `src/globals/NativeBridge.js` | `remote.dialog` | Save/open dialogs. |
| `src/globals/NativeBridge.js` | `remote.BrowserWindow` | Modal child window creation from the renderer. |
| `src/globals/NativeBridge.js` | `remote.powerSaveBlocker` | Prevent display sleep. |
| `src/globals/NativeBridge.js` | `remote.getGlobal(...)` | Reads main globals from the renderer. |
| `src/globals/NativeBridge.js` | `remote.Menu`, `remote.MenuItem` | Menu construction and application menu updates. |
| `src/globals/NativeBridge.js` | `remote.require` | Exposed as `global.nativeRequire` for native/runtime module loading. |
| `scripts/DBBridgeRender.js` | `remote.app.getPath("userData")` | DB root and logger root resolution in renderer code. |
| `scripts/DBBridgeRender.js` | `remote.getGlobal("ROOT")` | Worker path resolution for the GL worker. |

Assessment:
- `remote` usage is concentrated in `src/globals/NativeBridge.js` plus one renderer DB bridge.
- This makes preload and explicit IPC migration realistic without a large initial refactor.

What IPC means here:
- IPC stands for Inter-Process Communication.
- In Electron, the renderer and main process send messages to each other instead of sharing direct object access.
- This repo already uses IPC for `db-manager`, `store-update`, `cloud-sync`, `cloud-disconnect`, `data-migration`, `browser-window`, and update flows.
- The modernization goal is to move privileged renderer behavior from `remote` to explicit IPC and preload APIs.

## Renderer `global.*` Inventory

Global mutation is centralized in bootstrap files, but global reads and writes are scattered through the renderer runtime.

### Bootstrap assignments

| File | Global surface |
| --- | --- |
| `main.js` | `THREAD`, `ROOT`, `debug`, `mainWindow`, `previousVersion` |
| `auto-updater.js` | `updateFound`, `updateInstalled` |
| `src/globals/NativeBridge.js` | `nativeRequire`, `UIManager`, `IOManager`, `PowerManager`, `NativeLinker`, `Menu`, `MenuItem`, `UATracker`, `StrokesCodec` |
| `src/index.js` | `MainMenuManager`, `DBManager`, `MANUAL_PAIRING`, `SmartPadNS`, `SmartPadUSB`, `SmartPadSPP`, `SmartPadBLE` |
| `src/main.js` | `AuthenticationManager`, `LocalesManager`, `DeviceManager`, `AppManager`, `UAManager`, `HWRClient`, `EulaManager`, `ContentManager`, `WILL`, `SettingsTab`, `mainMenuManager`, `contextMenuManager`, `whatsNew` |
| `src/components/App.js` | `redirect`, `updateState`, `getState` |

### High-value global dependency patterns

| Pattern | Main files | Risk |
| --- | --- | --- |
| Imperative navigation and state escape hatches | `src/components/App.js`, `src/globals/AppManager.js`, `src/globals/AuthenticationManager.js`, `src/globals/DeviceManager.js`, `src/actions/modals.js`, `src/actions/fte.js`, `src/components/Terms.js`, `src/components/Terms.EULA.js`, `src/components/Library.js` | Makes behavior hard to trace and blocks cleaner React/router boundaries. |
| Mutable device singleton `global.smartPad` | `src/globals/DeviceManager.js`, `scripts/WILL.js` | Large hidden state surface across connectivity and live editing flows. |
| Global menu managers | `src/main.js`, `src/actions/library.js`, `src/components/EditMode.js`, `src/components/Library.js`, `src/globals/DeviceManager.js` | Cross-cutting UI control from many locations. |
| Main-process globals read from renderer | `src/main.js`, `src/components/App.js`, `src/components/update.js`, `src/components/Terms.js`, `src/components/Terms.EULA.js`, `src/images.js` | Tight coupling to `remote.getGlobal` and main bootstrap order. |
| Native module loading via `global.nativeRequire` | `scripts/ThreadBridge.js`, `scripts/connectivity/SmartPadSPP.js`, `scripts/connectivity/SmartPadBLEUnix.js`, `scripts/connectivity/SmartPadUSB.js` | Keeps renderer/runtime code dependent on unrestricted Node/Electron access. |

Assessment:
- Global setup is concentrated.
- Global consumption is scattered, especially across device management, navigation, and menu flows.
- `global.redirect`, `global.updateState`, `global.getState`, and `global.smartPad` are the most important cleanup targets after the Electron boundary work starts.

## IPC And Bridge Inventory

### Renderer <-> main channels

| Channel | Renderer side | Main side | Purpose |
| --- | --- | --- | --- |
| `browser-window` | `src/globals/NativeBridge.js` | `main.js` | Register sender and forward minimize/restore state. |
| `data-migration` | `src/globals/NativeBridge.js` | `scripts/DBBridgeMain.js` | Trigger migration completion callback. |
| `store-update` | `src/globals/NativeBridge.js` | `scripts/DBBridgeMain.js` | Connect renderer to worker-driven store/library/cloud updates. |
| `cloud-sync` | `src/globals/NativeBridge.js` | `scripts/DBBridgeMain.js` | Start cloud sync through the DB bridge. |
| `cloud-disconnect` | `src/globals/NativeBridge.js` | `scripts/DBBridgeMain.js` | Disconnect cloud integration. |
| `db-manager` | `scripts/DBBridgeRender.js` | `scripts/DBBridgeMain.js` | Generic DB RPC bridge between renderer and DB worker. |
| `main-thread-log` | `scripts/ConsoleBridge.js` | `scripts/ConsoleBridge.js` | Main/renderer log forwarding. |
| `auto-updater-update-menu` | `src/globals/MainMenuManager.js` | `auto-updater.js` | Refresh update menu state. |
| `auto-updater-check-for-update` | `src/components/update.js`, `src/globals/MainMenuManager.js` | `auto-updater.js` | Check for updates. |
| `auto-updater-restart-to-update` | `src/components/update.js` | `auto-updater.js` | Restart and install update. |

### Worker bridge surfaces

| Bridge | Files | Purpose |
| --- | --- | --- |
| DB worker bridge | `scripts/DBBridgeMain.js`, `scripts/workers/DBWorker.js`, `scripts/ThreadBridge.js` | Main-process DB worker orchestration and DB RPC forwarding. |
| GL export worker bridge | `scripts/DBBridgeRender.js`, `scripts/workers/GLWorker.js`, `scripts/ThreadBridge.js` | Export note, export notes, and export layer preview flows. |
| WILL worker bridge | `scripts/WILL.Messanger.js`, `scripts/workers/WILLWorker.js` | Ink processing via `postMessage`. |

Assessment:
- The DB bridge is the most important non-trivial runtime contract because it couples renderer IPC, main process logic, and worker messaging.
- `src/globals/NativeBridge.js` is the main surface to split into explicit preload APIs later.

## Native And Nonstandard Dependency Inventory

| Dependency | Source | Notes |
| --- | --- | --- |
| `gl` | npm | Native export/render dependency. Rebuild behavior matters in Electron 12 environments. |
| `usb` | npm | Native device integration dependency. |
| `serialport` | npm | Native serial/SPP dependency. |
| `leveldown` | npm | Native storage dependency behind LevelDB. |
| `threads` | npm | Worker bridge runtime used by DB and GL flows. |
| `noble-mac` | GitHub optional dependency | macOS BLE support path. |
| `xpc-connection` | GitHub optional dependency | macOS BLE support helper. |
| `cloud-js` | Bitbucket SSH dependency | Private dependency and install-time access risk. |

Rebuild notes already visible in the repo:
- `app-scripts/postinstall.js` automatically runs `npm run electron-rebuild` when native dependencies are present.
- `app-scripts/electron-rebuild.js` adds a temporary `python -> python3` shim on non-Windows platforms when needed.
- `project.config.js` marks several native modules as webpack externals and expects them at runtime.

## Mission-Critical Runtime Flows

These flows should be treated as required validation targets during modernization.

1. Local DB open and read/write path.
2. Renderer bootstrap through to library view.
3. Note rendering and edit/live save path.
4. Cloud auth and sync path.
5. Device discovery, pairing, and connection path.
6. Export path through the GL worker.

## Phase 0 Conclusions

1. `remote` is concentrated and is a strong first modernization target.
2. `global.*` is more deeply embedded and should be reduced in stages, starting with navigation/state escape hatches and device singleton state.
3. The DB bridge is the highest-risk IPC surface because it couples renderer, main, and worker behavior.
4. Native dependency risk is still real, but `gl` should now be treated as a native rebuild/runtime concern rather than a sibling-repo concern.
5. Verification is currently mostly manual, so smoke coverage has to be documented before Phase 1 edits begin.
