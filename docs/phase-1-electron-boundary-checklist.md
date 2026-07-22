# Phase 1 Electron Boundary Checklist

## Purpose

This checklist turns Phase 1 of `docs/modernization-plan.md` into concrete implementation steps based on the current Phase 0 findings.

Primary references:
- `docs/modernization-plan.md`
- `docs/modernization-inventory.md`
- `docs/smoke-test-checklist.md`

## Phase 1 Goal

Reduce legacy renderer privileges without changing user-visible behavior.

Definition of success for this phase:
- a preload entrypoint exists
- first renderer-native APIs no longer use direct `remote`
- no new `global.*` runtime dependencies are introduced
- the app still boots and completes the core smoke flows

## Current High-Risk Surfaces

### Main-process configuration

- `main.js:266-270`
  - `enableRemoteModule: true`
  - `nodeIntegration: true`
  - `contextIsolation: false`

### Concentrated `remote` usage

- `src/globals/NativeBridge.js`
  - window access
  - dialogs
  - app path access
  - menu APIs
  - power APIs
  - `remote.getGlobal(...)`
  - `remote.require`
  - renderer-created modal window
- `scripts/DBBridgeRender.js`
  - `remote.app.getPath("userData")`
  - `remote.getGlobal("ROOT")`

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

## Ordered Checklist

### 1. Add preload infrastructure

- Add a preload entry file for the main BrowserWindow.
- Update `main.js` BrowserWindow configuration to point at the preload script.
- Keep behavior stable before attempting stricter Electron settings.
- Decide and document the initial preload namespace exposed to the renderer.

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

Exit criteria:
- preload exposes a documented minimal API
- renderer can read it without importing `remote`

### 3. Replace app/path access first

Current direct usages:
- `src/globals/NativeBridge.js`: `remote.app.getPath("downloads")`
- `scripts/DBBridgeRender.js`: `remote.app.getPath("userData")`

Checklist:
- Add explicit preload/main accessors for the required paths.
- Replace renderer path lookups with preload-backed calls.
- Keep path names explicit, for example downloads path vs userData path.
- Verify DB root and logger root still resolve correctly.

Exit criteria:
- no renderer code uses `remote.app.getPath(...)`
- app start and DB open smoke checks still pass

### 4. Replace dialog APIs next

Current direct usages:
- `src/globals/NativeBridge.js`: `showSaveDialog`
- `src/globals/NativeBridge.js`: `showOpenDialog`

Checklist:
- Move save/open dialog execution behind preload and main.
- Keep the renderer contract value-based: inputs and returned file paths only.
- Do not expose the dialog module itself to the renderer.
- Confirm export/import flows still work with the new bridge.

Exit criteria:
- renderer no longer calls `remote.dialog`
- save/open flows still behave the same

### 5. Replace `remote.getGlobal(...)` reads

Current known reads:
- `ROOT`
- `previousVersion`
- `updateFound`

Checklist:
- Identify each global read and what data shape the renderer actually needs.
- Expose named preload accessors instead of a generic `getGlobal(name)` escape hatch.
- Replace call sites in:
  - `src/globals/NativeBridge.js`
  - `scripts/DBBridgeRender.js`
  - `src/main.js`
  - any renderer UI entry points that depend on update/version globals

Exit criteria:
- renderer no longer uses generic `remote.getGlobal(...)`
- boot, migration, and update checks still pass

### 6. Replace window lifecycle/event access

Current direct usages:
- `remote.getCurrentWindow().on(...)`
- `maximize()`
- `reload()`
- renderer-created modal parent lookup

Checklist:
- Decide which window actions truly need renderer initiation.
- Expose only those actions through preload.
- Keep minimize/restore notifications working through the existing `browser-window` IPC flow or a narrower equivalent.
- Remove direct renderer event binding to Electron window objects.

Exit criteria:
- renderer no longer depends on `remote.getCurrentWindow()` for the first migrated surfaces
- minimize/restore and requested window actions still work

### 7. Replace menu APIs

Current direct usages:
- `remote.Menu`
- `remote.MenuItem`
- `remote.Menu.setApplicationMenu(...)`

Checklist:
- Determine whether renderer truly needs to construct menus or only request menu updates.
- Prefer main-owned menu construction where feasible.
- If full replacement is too large for the first slice, isolate menu usage behind a preload wrapper without expanding its surface.

Exit criteria:
- menu dependency surface is reduced or explicitly isolated for a later slice
- no broader menu coupling is introduced

### 8. Replace power APIs

Current direct usages:
- `remote.powerMonitor`
- `remote.powerSaveBlocker`

Checklist:
- Split read-only event subscription from privileged power-save control.
- Expose only the suspend/resume events and blocker controls actually needed by the renderer.
- Keep sleep-prevention behavior stable for the affected flows.

Exit criteria:
- power events and blocker use no longer require direct `remote`
- affected flows still behave correctly

### 9. Eliminate `remote.require`

Current usage:
- `src/globals/NativeBridge.js` sets `global.nativeRequire = remote.require`

Downstream dependency points include:
- `scripts/ThreadBridge.js`
- `scripts/connectivity/SmartPadSPP.js`
- `scripts/connectivity/SmartPadBLEUnix.js`
- `scripts/connectivity/SmartPadUSB.js`

Checklist:
- Inventory every renderer-side consumer of `global.nativeRequire` before changing it.
- Decide which consumers can use normal imports and which need a dedicated preload/main bridge.
- Do not replace `remote.require` with another unrestricted renderer escape hatch.
- Treat this as a later Phase 1 slice if it is too large for the first preload PR.

Exit criteria:
- there is a plan per current `nativeRequire` consumer
- no new code is added on top of `global.nativeRequire`

### 10. Revisit BrowserWindow security settings only after the first replacements land

Checklist:
- After the first preload-backed APIs are stable, test whether `enableRemoteModule` can be disabled.
- Plan follow-up work for reducing `nodeIntegration` reliance.
- Plan follow-up work for enabling `contextIsolation` once the renderer stops assuming direct global mutation across contexts.

Exit criteria:
- security setting changes are sequenced behind working preload replacements
- no setting is flipped without validating affected surfaces first

### 11. Check insecure TLS behavior

Checklist:
- Search for certificate verification bypasses, permissive session handlers, or environment flags that weaken TLS behavior.
- Document whether they are dev-only or active in normal runtime.
- Remove or restrict them if safe during this phase; otherwise, carry them as a named follow-up item.

Exit criteria:
- current TLS bypass behavior is documented
- unsafe defaults are either reduced or explicitly tracked

## Recommended PR Sequence

1. PR 1: preload skeleton only
2. PR 2: app path access plus dialog APIs
3. PR 3: `remote.getGlobal(...)` replacements for `ROOT`, `previousVersion`, and `updateFound`
4. PR 4: window lifecycle and power APIs
5. PR 5: menu isolation and `remote.require` follow-up
6. PR 6: attempt `enableRemoteModule: false` after the above surfaces are stable

## Per-PR Verification Checklist

For every Phase 1 PR, run the applicable parts of `docs/smoke-test-checklist.md`.

Minimum expected verification for most Phase 1 changes:
- `npm run build-dev`
- app start
- DB open
- basic navigation
- update flow if touching version/update globals
- export flow if touching DB bridge or GL worker path resolution

## First Concrete Implementation Slice

Use this as the first coding target unless a blocker appears.

1. Add preload entrypoint.
2. Expose explicit downloads path and userData path accessors.
3. Expose save/open dialog helpers.
4. Replace the corresponding `remote.app.getPath(...)` and `remote.dialog` usages in:
   - `src/globals/NativeBridge.js`
   - `scripts/DBBridgeRender.js`
5. Verify:
   - build succeeds
   - app boots
   - DB opens
   - a save/open dialog flow still works

## Not In Scope For The First Phase 1 Slice

- removing all globals
- replacing the DB bridge architecture
- store/routing modernization
- device-manager refactors
- full `nodeIntegration` removal in one step
- full `contextIsolation` enablement in one step
