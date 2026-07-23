# Phase 2 Native Module Boundary Checklist

## Purpose

This checklist turns Phase 2 of `docs/modernization-plan.md` into concrete implementation steps.

Primary references:
- `docs/modernization-plan.md`
- `docs/modernization-inventory.md`
- `docs/smoke-test-checklist.md`

## Phase 2 Goal

Remove renderer-loaded native modules from the renderer execution path so stricter Electron hardening becomes possible.

Definition of success for this phase:
- no native `.node` module loads in the renderer
- `global.nativeRequire` is gone
- `app.allowRendererProcessReuse = false` is no longer needed
- app boot, DB open, and affected connectivity flows still work

## Current Constraint

The app no longer depends on active Electron `remote`, but it still depends on legacy renderer-loaded native modules.

Current compatibility path:
- `main.js`
  - `app.allowRendererProcessReuse = false`
- `src/globals/NativeBridge.js`
  - defines `global.nativeRequire`

Current native-module consumers:
- `scripts/connectivity/SmartPadSPP.js`
  - `nativeRequire("serialport")`
- `scripts/connectivity/SmartPadUSB.js`
  - `nativeRequire("usb")`
- `scripts/connectivity/SmartPadBLEUnix.js`
  - `nativeRequire("noble-mac")`
- `scripts/ThreadBridge.js`
  - renderer uses `nativeRequire("threads")`
  - main still falls back to normal `require("threads")`

## Concrete Inventory

| Native module | Current consumer | Renderer import path | Load timing | Current purpose | Proposed migration direction |
| --- | --- | --- | --- | --- | --- |
| `serialport` | `scripts/connectivity/SmartPadSPP.js` | `src/index.js` -> `global.SmartPadSPP = require("../scripts/connectivity/SmartPadSPP")` | Eager at renderer boot | SPP transport discovery and connection | Move transport-native access to main and expose a value-based connectivity bridge to renderer |
| `usb` | `scripts/connectivity/SmartPadUSB.js` | `src/index.js` -> `global.SmartPadUSB = require("../scripts/connectivity/SmartPadUSB")` | Eager at renderer boot | USB attach, detach, discovery, and device connection | Move USB watcher and device events to main, then forward state and commands over IPC |
| `noble-mac` | `scripts/connectivity/SmartPadBLEUnix.js` through `scripts/connectivity/SmartPadBLE.js` | `src/index.js` -> `require("../scripts/connectivity/SmartPadBLE")` | Eager module load, capability check during boot | macOS BLE state, scan, and connect behavior | Move BLE-native access to main and keep renderer on higher-level BLE state and command events |
| `threads` | `scripts/ThreadBridge.js` via `scripts/DBBridgeRender.js` | `src/index.js` -> `new DBBridge()` -> `DBBridgeRender` -> `new ThreadBridge(...)` | Eager during renderer DB bridge construction | GL worker startup in renderer and worker abstraction shared with main | Split renderer and main worker startup responsibilities, then remove renderer-native `threads` loading |

## Rules For Phase 2 Work

1. Keep changes behavior-preserving.
2. Move native access out of renderer incrementally, one module or one transport at a time.
3. Do not remove `global.nativeRequire` until all active renderer consumers are migrated.
4. Prefer explicit APIs per capability, not a generic native-module loader replacement.
5. Validate the app boot path after every module migration, not just webpack build output.
6. Treat device connectivity paths as high-risk and verify them separately from generic UI boot.

## Ordered Checklist

### 1. Inventory every renderer-side native dependency path

Checklist:
- Confirm every current `nativeRequire` consumer.
- Identify which startup path imports each module.
- Trace whether the module is loaded eagerly at renderer boot or only during a later user flow.
- Note whether the module is Electron-only or also used in UWP/main paths.
- Keep the concrete inventory table updated as decisions change.

Current known targets:
- `serialport`
- `usb`
- `noble-mac`
- `threads`

Exit criteria:
- each `nativeRequire` consumer is listed
- each consumer has an owning runtime path and a migration note

### 2. Classify each module by migration strategy

For each native module, decide whether it should:
- move fully to main
- move behind an existing worker bridge
- move behind a new preload/main IPC contract
- stay native but be loaded only in main-owned code

Recommended initial assumptions:
- `serialport`: likely main-owned connectivity bridge candidate
- `usb`: likely main-owned connectivity bridge candidate
- `noble-mac`: likely main-owned connectivity bridge candidate
- `threads`: likely keep worker-based but remove renderer-native loading requirement

Exit criteria:
- every target module has a chosen strategy
- any unresolved strategy questions are documented explicitly

### 3. Start with the highest-risk renderer-loaded binding

Recommended first migration target:
- `serialport`

Why first:
- it already produced a renderer native-module loading failure during the previous attempt
- it is a concrete blocker for stricter Electron settings

Checklist:
- identify where `SmartPadSPP` truly needs native access vs higher-level transport behavior
- move native serialport loading out of renderer
- keep the renderer contract value-based where possible
- verify app boot after the first migration before touching the next module

Exit criteria:
- renderer no longer loads `serialport`
- the app still boots and SPP-related flows do not regress obviously

### 4. Migrate the USB native binding

Target:
- `scripts/connectivity/SmartPadUSB.js`

Checklist:
- identify attach, detach, discovery, and connect responsibilities that can move to main
- decide how USB events are forwarded back to renderer state
- preserve current `usbConnected` state behavior in the UI

Exit criteria:
- renderer no longer loads `usb`
- USB attach and detach signaling still reaches the app correctly

### 5. Migrate the BLE macOS native binding

Target:
- `scripts/connectivity/SmartPadBLEUnix.js`

Checklist:
- identify how much of BLE scanning and state handling can move to main
- preserve powered-on, powered-off, scan, and connect event flow
- be careful not to assume the UWP or Windows BLE paths work the same way

Exit criteria:
- renderer no longer loads `noble-mac`
- BLE state and scan flows still behave correctly on the supported macOS path

### 6. Migrate or isolate `threads`

Target:
- `scripts/ThreadBridge.js`

Checklist:
- determine why the renderer currently needs to native-load `threads`
- decide whether worker creation can move to main or be wrapped behind a narrower runtime abstraction
- preserve DB worker and GL worker startup behavior

Exit criteria:
- renderer no longer requires native loading of `threads`
- DB and GL worker flows still start and communicate correctly

### 7. Remove the compatibility escape hatch

Checklist:
- after all renderer consumers are migrated, remove `global.nativeRequire`
- remove any remaining renderer code paths that assume unrestricted native loading
- remove the compatibility note in `main.js` if it is no longer true

Exit criteria:
- no active code depends on `global.nativeRequire`

### 8. Re-enable renderer process reuse

Checklist:
- remove `app.allowRendererProcessReuse = false`
- verify no native module tries to load inside renderer during app boot or common flows
- keep an eye out for Electron warnings about non-context-aware native modules

Exit criteria:
- `app.allowRendererProcessReuse = false` is gone
- the app still boots successfully

### 9. Capture the Phase 2 stopping point for Phase 4 and Phase 5

Checklist:
- document whether renderer native-module loading is fully gone
- document whether `contextIsolation` can now be attempted safely
- document whether `nodeIntegration` reduction is still blocked by other renderer dependencies

Exit criteria:
- the next hardening step is explicit and evidence-based

## Suggested Execution Order

1. inventory all `nativeRequire` consumers
2. choose strategy per module
3. migrate `serialport`
4. migrate `usb`
5. migrate `noble-mac`
6. migrate or isolate `threads`
7. remove `global.nativeRequire`
8. re-enable renderer process reuse
9. reassess readiness for `contextIsolation`

## Per-Slice Verification Checklist

Minimum verification for every Phase 2 slice:
- `npm run build-dev`
- app start
- DB open
- basic navigation

Add targeted verification depending on the module being migrated:
- `serialport`: SPP startup or discovery path if locally testable
- `usb`: attach and detach detection if locally testable
- `noble-mac`: BLE powered-on or scan path if locally testable
- `threads`: DB worker and GL worker startup

## Risks

- connectivity modules may assume renderer process state or globals in ways that are not obvious from the native import alone
- moving native bindings to main may require new IPC contracts that widen the migration surface temporarily
- worker startup order may depend on current renderer boot assumptions
- some verification paths may require hardware that is not always available locally

## Explicit Non-Goals For Phase 2

- full device-manager redesign
- replacing all native modules at once
- `contextIsolation` enablement in the same slice as the first native-module migration
- `nodeIntegration` removal in the same slice as the first native-module migration
- broader React, Redux, or routing modernization
