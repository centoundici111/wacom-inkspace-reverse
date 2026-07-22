# Dependency Risk Matrix

## Purpose

This matrix captures the current Phase 0 view of dependency risk for modernization work.

## Dev Environment Baseline

- Node.js `14.16.1`
- npm `6.14.12`
- Electron `12.0.2`
- Electron rebuild wrapper: `app-scripts/electron-rebuild.js`
- Automatic native rebuild hook: `app-scripts/postinstall.js`

## Why `remote` Is A Risk

Electron `remote` lets renderer code directly use main-process APIs and objects.
In this repo, that currently includes window control, dialogs, app paths, menus, power APIs, main globals, and even `remote.require` through `src/globals/NativeBridge.js`.

This is risky because:

1. It weakens the security boundary between renderer and main.
2. It increases upgrade friction because modern Electron expects `preload` plus explicit IPC instead of broad `remote` access.
3. It hides important runtime coupling, especially when renderer code reads main globals or loads native modules directly.
4. It makes behavior harder to trace and test because renderer code can perform privileged work without an explicit contract.

In this app, `remote` is one of the first modernization targets because it is still enabled in `main.js` through:

- `enableRemoteModule: true`
- `nodeIntegration: true`
- `contextIsolation: false`

## What IPC Means

IPC means Inter-Process Communication.

In Electron, the renderer and main process are separate processes, so they communicate by sending messages instead of directly sharing objects.
The safer modern pattern is:

1. renderer asks for a specific capability
2. main process performs the privileged action
3. main returns only the result the renderer needs

This repo already uses IPC for several important flows, including:

- `db-manager`
- `store-update`
- `cloud-sync`
- `cloud-disconnect`
- `data-migration`
- `browser-window`
- auto-updater channels in `auto-updater.js`

## `remote` vs IPC

| Pattern | Meaning | Risk profile |
| --- | --- | --- |
| `remote` | Renderer directly reaches into main-process APIs | Higher risk, weaker boundaries, more upgrade-hostile |
| IPC | Renderer requests a specific action through an explicit channel | Safer, clearer contracts, better aligned with modern Electron |

Phase 1 is structured around replacing concentrated `remote` usage with narrower preload and IPC surfaces instead of broad direct renderer access.

## Risk Matrix

| Dependency | Version/source | Type | Current role | Risk | Current evidence | Suggested Phase 2 posture |
| --- | --- | --- | --- | --- | --- | --- |
| `gl` | `^6.0.2` from npm | Native | GL-backed export/render worker dependency | High | Native rebuild sensitivity; Electron ABI alignment; export path depends on worker startup | Keep for now, isolate as export dependency, document rebuild/runtime expectations |
| `usb` | `^1.6.3` | Native | USB device connectivity | High | Native module, runtime device integration, webpack external | Keep and audit Electron/Node compatibility before upgrades |
| `serialport` | `^9.0.4` | Native | Serial/SPP device connectivity | High | Native module and runtime connectivity path | Keep and audit compatibility and hardware smoke expectations |
| `leveldown` | `^5.6.0` | Native | Local DB storage backend | High | Native module under core DB path | Keep short term; treat as core runtime dependency |
| `threads` | `^0.12.1` | Native-adjacent runtime | DB and GL worker orchestration | Medium-High | Worker bridge is central to DB/export flows | Keep short term; audit Electron compatibility and worker contract stability |
| `noble-mac` | GitHub optional dependency | Native/optional | macOS BLE support | Medium-High | Optional dependency with platform-specific maintenance risk | Isolate and verify only on affected platforms |
| `xpc-connection` | GitHub optional dependency | Native/optional | macOS BLE support helper | Medium | Optional, platform-specific, GitHub-sourced | Isolate behind BLE support needs |
| `cloud-js` | Bitbucket SSH dependency | Private dependency | Cloud sync/auth support | High | Install depends on SSH access to a private host | Keep for now, but document access/setup and evaluate source control risk |
| `electron` | `^12.0.2` | Platform | Desktop runtime | High | Old baseline; legacy renderer privileges still enabled | Upgrade only after boundary cleanup and dependency audit |
| `react-router-redux` | `^4.0.8` | Obsolete app dependency | Routing/store integration | Medium | Legacy library in bootstrap path | Replace in Phase 4 |
| `react-intl-redux` | `^2.2.0` | Obsolete app dependency | Intl/store integration | Medium | Legacy store integration | Replace in Phase 4 |

## Rebuild And Install Notes

| Topic | Current behavior |
| --- | --- |
| Native rebuild trigger | `postinstall` runs Electron rebuild automatically when native dependencies are installed |
| Manual rebuild | `npm run electron-rebuild` |
| Python fallback | Rebuild wrapper creates a temporary `python` shim to `python3` on non-Windows systems when needed |
| Webpack externals | `project.config.js` excludes native modules such as `leveldown`, `threads`, `usb`, `noble-mac`, and `serialport` from bundling |
| Private dependency access | `cloud-js` requires Bitbucket SSH access during install |

## Immediate Ranking For Modernization Planning

1. Electron renderer boundary and `remote` usage.
2. `leveldown` because it sits on the local DB critical path.
3. `usb` and `serialport` because device support is product-critical and native.
4. `gl` because export behavior depends on native rebuild/runtime alignment.
5. `threads` because worker contracts are central to DB and export flows.
6. `cloud-js` because private dependency access can block install and CI.
7. `noble-mac` and `xpc-connection` because they are platform-specific rather than universal blockers.

## Phase 0 Recommendation

Do not attempt to replace these dependencies during Phase 0.
Use this matrix to decide which dependencies need compatibility proof, isolation, or replacement work before the Electron upgrade program begins.
