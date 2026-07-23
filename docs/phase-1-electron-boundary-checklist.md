# Phase 1 Electron Boundary Checklist

## Purpose

This checklist turns Phase 1 of `docs/modernization-plan.md` into concrete implementation steps based on the current Phase 0 findings.

Primary references:
- `docs/modernization-plan.md`
- `docs/modernization-inventory.md`
- `docs/smoke-test-checklist.md`

## Phase 1 Goal

Remove active renderer `remote` usage without changing user-visible behavior, while preserving the app's current legacy native-module compatibility path.

Definition of success for this phase:
- a preload entrypoint exists
- active Electron renderer bridge APIs no longer use direct `remote`
- no new `global.*` runtime dependencies are introduced
- the app still boots and completes the core smoke flows
- `enableRemoteModule` is no longer enabled in BrowserWindow creation

## Current High-Risk Surfaces

### Main-process configuration

- `main.js`
  - `enableRemoteModule: false`
  - `nodeIntegration: true`
  - `contextIsolation: false`
  - `app.allowRendererProcessReuse = false`

### Former concentrated `remote` usage

- `src/globals/NativeBridge.js`
  - app path access
  - dialogs
  - window access
  - menu APIs
  - power APIs
  - `remote.getGlobal(...)`
  - `remote.require`
  - renderer-created modal window
- `scripts/DBBridgeRender.js`
  - `remote.app.getPath("userData")`
  - `remote.getGlobal("ROOT")`

Status:
- these Electron surfaces have now been migrated behind preload/main IPC

### Remaining Electron-hardening blockers discovered during implementation

- `src/globals/NativeBridge.js`
  - still defines `global.nativeRequire` for renderer compatibility
- `scripts/ThreadBridge.js`
- `scripts/connectivity/SmartPadUSB.js`
- `scripts/connectivity/SmartPadSPP.js`
- `scripts/connectivity/SmartPadBLEUnix.js`
  - these still load native modules through `nativeRequire`

### Existing IPC contracts that must keep working

- `db-manager`
- `store-update`
- `cloud-sync`
- `cloud-disconnect`
- `data-migration`
- `browser-window`
- `main-thread-log`
- auto-updater channels in `auto-updater.js`

## Rules For Phase 1 Work

1. Keep changes behavior-preserving.
2. Replace `remote` incrementally, not all at once.
3. Do not remove existing IPC channels unless a replacement is already wired through.
4. Do not introduce new broad globals to replace `remote`.
5. Prefer small preload APIs with narrow names and narrow payloads.
6. Keep the renderer unaware of Electron internals where possible.
7. Do not remove `nativeRequire` until the affected native modules are moved off the renderer path.

## Ordered Checklist

### 1. Add preload infrastructure

- Add a preload entry file for the main BrowserWindow.
- Update `main.js` BrowserWindow configuration to point at the preload script.
- Keep behavior stable before attempting stricter Electron settings.
- Decide and document the initial preload namespace exposed to the renderer.

Implementation result:
- complete

Exit criteria:
- preload file exists
- main window loads with preload attached
- no runtime regression from adding preload alone

### 2. Define the first preload API surface

Create a narrow API that covers only the first migration slice.

Recommended first capabilities:
- app path reads needed by renderer code
- save/open dialog access
- minimal main-global reads that are still required for boot

Avoid exposing:
- generic `send(event)` style APIs unless there is no better immediate option
- raw Electron objects
- generic `require`
- raw `BrowserWindow`, `Menu`, or `dialog` instances

Implementation result:
- complete, although the preload surface later expanded to cover menus, power, and window actions

Exit criteria:
- preload exposes a documented minimal API
- renderer can read it without importing `remote`

### 3. Replace app/path access first

Current direct usages:
- `src/globals/NativeBridge.js`: `remote.app.getPath("downloads")`
- `scripts/DBBridgeRender.js`: `remote.app.getPath("userData")`

Implementation result:
- complete

Exit criteria:
- no renderer code uses `remote.app.getPath(...)`
- app start and DB open smoke checks still pass

### 4. Replace dialog APIs next

Current direct usages:
- `src/globals/NativeBridge.js`: `showSaveDialog`
- `src/globals/NativeBridge.js`: `showOpenDialog`

Implementation result:
- complete

Exit criteria:
- renderer no longer calls `remote.dialog`
- save/open flows still behave the same

### 5. Replace `remote.getGlobal(...)` reads

Current known reads:
- `ROOT`
- `previousVersion`
- `updateFound`
- `updateInstalled`

Implementation result:
- complete for the known Electron renderer reads

Exit criteria:
- renderer no longer uses generic `remote.getGlobal(...)`
- boot, migration, and update checks still pass

### 6. Replace window lifecycle and event access

Current direct usages:
- `remote.getCurrentWindow().on(...)`
- `maximize()`
- `reload()`
- renderer-created modal parent lookup

Implementation result:
- complete for the active surfaces migrated in `src/globals/NativeBridge.js`

Exit criteria:
- renderer no longer depends on `remote.getCurrentWindow()` for the migrated surfaces
- minimize/restore and requested window actions still work

### 7. Replace menu APIs

Current direct usages:
- `remote.Menu`
- `remote.MenuItem`
- `remote.Menu.setApplicationMenu(...)`

Implementation result:
- complete for the active Electron renderer menu path
- renderer now serializes menu templates and main materializes the actual Electron menus

Exit criteria:
- menu dependency surface is reduced or explicitly isolated for a later slice
- no broader menu coupling is introduced

### 8. Replace power APIs

Current direct usages:
- `remote.powerMonitor`
- `remote.powerSaveBlocker`

Implementation result:
- complete

Exit criteria:
- power events and blocker use no longer require direct `remote`
- affected flows still behave correctly

### 9. Eliminate `remote.require`

Original usage:
- `src/globals/NativeBridge.js` set `global.nativeRequire = remote.require`

Downstream dependency points:
- `scripts/ThreadBridge.js`
- `scripts/connectivity/SmartPadSPP.js`
- `scripts/connectivity/SmartPadBLEUnix.js`
- `scripts/connectivity/SmartPadUSB.js`

Implementation result:
- `remote.require` itself was removed from the active Electron bridge
- the app still requires `global.nativeRequire` for legacy renderer-loaded native modules
- a direct switch to plain renderer `require(...)` was not safe because it caused:
  - webpack externals/runtime resolution regressions
  - non-context-aware native module loading failures in renderer

Revised exit criteria:
- `remote.require` is gone
- `global.nativeRequire` is explicitly treated as a temporary compatibility path
- full removal of `global.nativeRequire` is deferred to the native-module boundary phase

### 10. Revisit BrowserWindow security settings only after the first replacements land

Checklist:
- After the first preload-backed APIs are stable, test whether `enableRemoteModule` can be disabled.
- Plan follow-up work for reducing `nodeIntegration` reliance.
- Plan follow-up work for enabling `contextIsolation` once the renderer stops assuming direct global mutation across contexts.

Implementation result:
- `enableRemoteModule` was successfully disabled
- `nodeIntegration` and `contextIsolation` remain unchanged
- `app.allowRendererProcessReuse = false` is now explicitly required for legacy renderer-loaded native modules

Exit criteria:
- security setting changes are sequenced behind working preload replacements
- no setting is flipped without validating affected surfaces first

### 11. Check insecure TLS behavior

Checklist:
- Search for certificate verification bypasses, permissive session handlers, or environment flags that weaken TLS behavior.
- Document whether they are dev-only or active in normal runtime.
- Remove or restrict them if safe during this phase; otherwise, carry them as a named follow-up item.

Status:
- still open

Exit criteria:
- current TLS bypass behavior is documented
- unsafe defaults are either reduced or explicitly tracked

## Recommended PR Sequence

Completed sequence:
1. preload skeleton
2. app path access plus dialog APIs
3. `remote.getGlobal(...)` replacements for `ROOT`, `previousVersion`, `updateFound`, and `updateInstalled`
4. window lifecycle and power APIs
5. menu isolation
6. remove active `remote` usage and disable `enableRemoteModule`

Follow-up phase:
1. native-module boundary extraction before attempting `contextIsolation` or `nodeIntegration` hardening

## Current Phase 1 Outcome

Completed in this phase:
- preload infrastructure added
- path, dialog, window, menu, power, and selected main-global APIs moved behind preload/main
- active `remote` usage removed from the Electron renderer bridge
- `enableRemoteModule` removed from BrowserWindow creation paths

Still intentionally deferred:
- `contextIsolation: true`
- `nodeIntegration: false`
- removal of `global.nativeRequire`
- re-enabling `app.allowRendererProcessReuse`

Reason for the deferral:
- the app still loads legacy native modules such as `serialport`, `usb`, `noble-mac`, and `threads` from the renderer path
- those modules require a broader architecture change than a simple preload replacement

## Per-PR Verification Checklist

For every Phase 1 PR, run the applicable parts of `docs/smoke-test-checklist.md`.

Minimum expected verification for most Phase 1 changes:
- `npm run build-dev`
- app start
- DB open
- basic navigation
- update flow if touching version or update globals
- export flow if touching DB bridge or GL worker path resolution

## Not In Scope For Phase 1

- removing all globals
- replacing the DB bridge architecture
- store or routing modernization
- device-manager refactors
- full `nodeIntegration` removal in one step
- full `contextIsolation` enablement in one step
- native-module extraction from renderer boot
