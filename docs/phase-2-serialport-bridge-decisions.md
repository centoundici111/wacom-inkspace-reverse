# Phase 2 Serialport Bridge Decisions

## Scope

This document records the decisions made for the first Phase 2 native-module boundary slice: moving `serialport` out of the renderer native load path while keeping current SPP behavior as stable as possible.

Primary references:
- `docs/modernization-plan.md`
- `docs/phase-2-native-module-boundary-checklist.md`

## Decision Summary

1. Move only the native `serialport` binding to main for this slice.
2. Keep `scripts/connectivity/SmartPadSPP.js` running in the renderer for now.
3. Add an explicit preload/main serial bridge instead of another generic native loader.
4. Preserve the current `SmartPadSPP` object contract so `src/globals/DeviceManager.js` does not need a broad rewrite in this slice.
5. Leave `global.nativeRequire` and `app.allowRendererProcessReuse = false` in place until the remaining renderer native consumers are migrated.

## Why This Shape Was Chosen

`SmartPadSPP` is tightly coupled to renderer-side runtime behavior today.

Current renderer dependencies that make a full move-to-main higher risk:
- `src/globals/DeviceManager.js` constructs `new SmartPadSPP(...)`
- `DeviceManager` subscribes directly to `SmartPadSPP` events
- `DeviceManager` relies on `instanceof SmartPadSPP`
- pairing and authorization use renderer UI callbacks through `resolveAuthorize`
- realtime and downloaded input transformation use renderer-owned `DeviceInputTransformer`

Because of that coupling, the smallest behavior-preserving step is to move only the native `serialport` API to main and keep the rest of the SPP protocol and app logic where it already lives.

## Implemented Boundary

### Main-owned native access

`main.js` now owns `require("serialport")` and exposes explicit IPC handlers for:
- listing ports
- opening a port
- writing bytes
- draining a port
- closing a port
- forwarding serial events back to the renderer

### Preload contract

`preload.js` now exposes serial-specific APIs on `window.__INKSPACE_PRELOAD__`:
- `listSerialPorts()`
- `openSerialPort(payload)`
- `writeSerialPort(payload)`
- `drainSerialPort(payload)`
- `closeSerialPort(payload)`
- `onSerialPortEvent(callback)`

### Renderer wrapper

`scripts/connectivity/SerialPortBridge.js` provides a renderer-safe `SerialPort` wrapper that matches the subset of the `serialport` API used by `SmartPadSPP`:
- `new SerialPort(path, options)`
- `SerialPort.list()`
- `open(callback)`
- `write(buffer, callback)`
- `drain(callback)`
- `close(callback)`
- event emission for `data`, `disconnect`, `error`, and `close`

### SPP migration point

`scripts/connectivity/SmartPadSPP.js` no longer uses `nativeRequire("serialport")`.
It now imports the renderer-safe bridge wrapper instead.

## Explicit Non-Goals For This Slice

These were intentionally deferred:
- moving the full `SmartPadSPP` runtime to main
- redesigning `DeviceManager`
- removing `instanceof SmartPadSPP` usage
- changing pairing or authorization UI flow
- changing input transformation ownership
- removing `global.nativeRequire`
- removing `app.allowRendererProcessReuse = false`

## Expected Result After This Slice

- renderer boot no longer native-loads `serialport`
- `SmartPadSPP` still exposes the same shape to `DeviceManager`
- SPP scan, connect, command, and event flows still pass through the existing renderer logic

## Remaining Phase 2 Blockers After This Slice

Renderer native-module consumers still remaining:
- `scripts/connectivity/SmartPadUSB.js` using `usb`
- `scripts/connectivity/SmartPadBLEUnix.js` using `noble-mac`
- `scripts/ThreadBridge.js` using `threads`

Because of those remaining consumers:
- `global.nativeRequire` must stay for now
- `app.allowRendererProcessReuse = false` must stay for now

## Verification Target

Minimum verification for this slice:
- `npm run build-dev`
- app boot
- DB open
- basic navigation

Targeted verification when hardware is available:
- SPP discovery path
- SPP connect/pair path
- SPP data/command flow after connection
