# Smoke Test Checklist

## Purpose

Use this checklist for Phase 0 validation and for modernization PRs that touch startup, Electron boundaries, DB access, device flows, or export behavior.

## Environment Prerequisites

- Node.js `14.16.1`
- npm `6.14.12`
- Native build tools installed for the current platform
- Bitbucket SSH access configured for `cloud-js`
- A machine that can run Electron `12.0.2`
- Device hardware available for device-flow checks when the change could affect connectivity

## Baseline Commands

1. `npm install`
2. `npm run build-dev`
3. `npm run start` or `npm run dev`

If native rebuild troubleshooting is needed:

1. `npm run electron-rebuild`
2. `SKIP_ELECTRON_REBUILD=1 npm install` only when intentionally debugging rebuild behavior

## Core Smoke Checklist

Mark each item as pass, fail, or not-run in PR notes.

### Install

- `npm install` completes without missing private dependency access or unrecoverable native build failures.
- Postinstall either completes Electron rebuild successfully or reports a known, documented reason it was skipped.
- `cloud-js` resolves successfully from Bitbucket SSH.

### Renderer build

- `npm run build-dev` completes successfully.
- Output is emitted to `dist/`.
- No newly introduced module-resolution failures appear for Electron/native externals.

### App start

- `npm run start` launches the main window.
- The renderer reaches first paint without a blank screen or startup crash.
- Hash routing loads the initial app shell correctly.
- No immediate runtime error appears from preload, IPC, `remote`, or bootstrap globals.

### DB open

- App opens the local DB successfully on startup.
- Settings, tags, and profile bootstrap complete.
- Library content initialization completes without DB bridge errors.

### Basic navigation

- App can reach `/library`.
- App can reach setup/terms flow when relevant.
- App can enter note creation/edit flow.
- Main menu state updates correctly when changing views.

### Device bootstrap path

- `DeviceManager.open("DEFAULT")` path runs without startup regression.
- USB/BLE/SPP detection does not throw during bootstrap on the current platform.
- If no device is attached, the app remains stable and reports a sensible disconnected state.

## Extended Smoke Checks

Run these when the touched code overlaps the related surface.

### Cloud

- Login flow can begin.
- Refresh token path does not regress.
- Cloud sync can be triggered and update state flows still arrive in the renderer.

### Export

- Export note path completes through the GL worker.
- Export layer preview still renders.
- No worker startup failure occurs from GL worker path resolution.

### Data migration

- Migration callback channel still works when `migrationCompleted` is false.
- App transitions back to normal runtime after migration completes.

### Update flow

- Update screen still appears when update flags are set.
- Check-for-update and restart-to-update IPC actions still reach `auto-updater.js`.

### Logging and diagnostics

- Main-thread log bridge still connects.
- Renderer warnings/errors remain visible enough to diagnose failures.

## Recommended Minimal Validation By Change Type

| Change type | Minimum smoke scope |
| --- | --- |
| Docs-only | No runtime smoke required |
| Renderer UI only | Build, app start, basic navigation |
| Routing/store/bootstrap | Build, app start, DB open, basic navigation |
| Electron boundary / preload / IPC | Install, build, app start, DB open, basic navigation, update flow |
| Device code | Install, build, app start, device bootstrap path, relevant hardware check |
| Export / GL worker | Install, build, app start, export |
| DB bridge / worker | Install, build, app start, DB open, cloud if touched |

## Known Gaps

- There is no obvious automated test suite covering these flows.
- Some smoke items require credentials, device hardware, or platform-specific access.
- Packaging validation is not part of the minimum smoke list for every PR, but should be added for Electron upgrade milestones.
