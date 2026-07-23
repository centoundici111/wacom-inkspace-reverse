# App Modernization Plan

## Goal

Modernize `Wacom Inkspace App` in a way that reduces upgrade risk first, then improves maintainability and developer velocity.

Primary strategy:
1. Stabilize the platform and build.
2. Remove Electron upgrade blockers in the right order.
3. Untangle renderer architecture.
4. Modernize state and routing.
5. Upgrade Electron and React in controlled steps.

## Current Constraints

### Platform/runtime
- Electron `12.0.2`
- Node `14.x`
- React `17`
- Webpack `5`
- Legacy Electron renderer model with:
  - `enableRemoteModule: false`
  - `nodeIntegration: true`
  - `contextIsolation: false`
  - `app.allowRendererProcessReuse = false`

### Architectural debt
- Heavy reliance on `global.*` in renderer bootstrap and app runtime
- Legacy native modules still loaded from the renderer through `global.nativeRequire`
- Custom IPC + DB worker bridge coupling renderer, main, and workers
- Legacy routing/state stack:
  - `react-router-redux`
  - `react-intl-redux`
- Large class-component surface in `src/components`

### Build/dependency risk
- Native modules: `usb`, `serialport`, `leveldown`, `threads`, `gl`
- `gl` still needs Electron-compatible rebuild/runtime validation across supported environments
- Private dependency: `cloud-js` over Bitbucket SSH
- No obvious automated test suite or CI safety net

## Evidence

### Electron security and upgrade blockers
- `main.js`
- `preload.js`
- `src/globals/NativeBridge.js`
- `scripts/DBBridgeRender.js`
- `scripts/ThreadBridge.js`
- `scripts/connectivity/SmartPadUSB.js`
- `scripts/connectivity/SmartPadSPP.js`
- `scripts/connectivity/SmartPadBLEUnix.js`

### Renderer global coupling
- `src/index.js`
- `src/main.js`
- `src/components/App.js`

### Legacy routing/state
- `src/main.js`
- `src/reducers/index.js`
- `src/actions/edit.js`
- `src/actions/fte.js`
- `src/actions/live.js`
- `src/actions/library.js`

### Native/build fragility
- `package.json`
- `project.config.js`
- `README.md`

## Modernization Principles

1. Prefer small, reversible changes.
2. Avoid broad rewrites before platform boundaries are cleaned up.
3. Separate runtime modernization from UI modernization.
4. Add verification before major upgrades.
5. Upgrade only after removing the blockers that make upgrades unsafe.

## Roadmap

## Phase 0: Planning And Safety Rails

Objective:
Create enough visibility and verification to modernize safely.

Tasks:
- Document the current supported dev environment.
- Define a smoke-test checklist for:
  - install
  - renderer build
  - app start
  - DB open
  - basic navigation
  - device bootstrap path
- Inventory:
  - all `remote` usage
  - all `global.*` usage
  - all IPC channels
  - all native dependencies and rebuild requirements
- Decide which flows are mission-critical:
  - local DB access
  - note rendering/editing
  - cloud sync
  - device connectivity
  - export paths

Deliverables:
- modernization inventory
- smoke test checklist
- dependency risk matrix

Current Phase 0 artifacts:
- `docs/modernization-inventory.md`
- `docs/smoke-test-checklist.md`
- `docs/dependency-risk-matrix.md`

Success criteria:
- We can identify the highest-risk runtime surfaces before editing architecture.

## Phase 1: Electron Boundary Cleanup

Objective:
Remove active renderer `remote` usage and introduce preload/main boundaries without breaking legacy native-module compatibility.

Tasks:
- Add a `preload` script.
- Introduce preload-backed renderer APIs for the first migrated Electron surfaces.
- Replace `remote` usage incrementally with explicit IPC contracts.
- Move window, dialog, app path, menu, and power APIs behind preload/main boundaries.
- Stop introducing new `global.*` runtime dependencies.
- Restrict or remove insecure TLS bypass behavior from dev/runtime flow.
- Preserve the current renderer-native compatibility path until native modules are extracted from renderer boot.

Initial target surfaces:
1. app/path access
2. dialog APIs
3. window lifecycle events
4. menu APIs
5. power management
6. global reads currently done via `remote.getGlobal`

Deliverables:
- preload entrypoint
- first safe IPC bridge layer
- removal of active `remote` usage in the Electron renderer bridge

Concrete Phase 1 checklist:
- `docs/phase-1-electron-boundary-checklist.md`

Success criteria:
- Renderer can access migrated Electron capabilities without direct `remote`.
- App still boots with behavior unchanged.
- `enableRemoteModule` is no longer enabled.

Current status:
- Completed:
  - preload entrypoint added and wired in `main.js`
  - app path, dialog, window, menu, power, and selected main-global reads moved behind preload/main IPC
  - active `remote` usage removed from `src/globals/NativeBridge.js`
  - `enableRemoteModule` removed from BrowserWindow creation paths
- Deferred from this phase:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - removal of `global.nativeRequire`
  - re-enabling renderer process reuse
- Key constraint discovered during implementation:
  - legacy native modules such as `serialport`, `usb`, `noble-mac`, and `threads` still rely on a renderer-side native loading path, so the app currently requires `global.nativeRequire` and `app.allowRendererProcessReuse = false`

## Phase 2: Native Module Boundary Extraction

Objective:
Remove renderer-loaded native modules from the renderer execution path so stricter Electron security settings become realistic.

Why this now comes next:
- Phase 1 removed `remote`, but a follow-up attempt to remove the native-module escape hatch caused runtime failures.
- The immediate hardening blocker is no longer `remote`; it is legacy native bindings still loaded in renderer boot.

Priority targets:
- `serialport`
- `usb`
- `noble-mac`
- `threads`

Tasks:
- Inventory each renderer-side native-module consumer and why it loads in renderer.
- Decide per module whether it should:
  - move fully to main
  - move behind an existing worker bridge
  - move behind a dedicated preload/main IPC contract
- Remove direct renderer loading of native `.node` modules.
- Remove `global.nativeRequire` after its consumers are migrated.
- Remove the need for `app.allowRendererProcessReuse = false`.

Deliverables:
- per-module migration map
- native bridge replacement plan
- updated blocker list for Electron hardening

Concrete Phase 2 checklist:
- `docs/phase-2-native-module-boundary-checklist.md`

Success criteria:
- no native `.node` module loads in the renderer
- `global.nativeRequire` is gone
- `app.allowRendererProcessReuse = false` is no longer needed

## Phase 3: Build And Native Dependency Stabilization

Objective:
Reduce environment fragility so Electron upgrades become realistic.

Tasks:
- Audit each native/private dependency:
  - keep
  - replace
  - isolate
- Prioritize these modules:
  - `gl`
  - `usb`
  - `serialport`
  - `leveldown`
  - `threads`
  - `noble-mac`
  - `cloud-js`
- Verify the remaining install, rebuild, and runtime requirements for `gl` in the Electron 12 environment.
- Document platform-specific rebuild behavior and toolchain expectations for `gl`.
- Confirm whether `gl` is still an Electron upgrade blocker or now just a standard native-module maintenance concern.
- Document exact rebuild steps and failure modes.
- Define a reproducible setup flow for local development and CI.

Deliverables:
- dependency upgrade matrix
- native rebuild playbook
- prioritized blocker list

Success criteria:
- Team can reliably install, rebuild, and run the app.
- Native blockers to Electron upgrade are known and ranked.

## Phase 4: Context Isolation Program

Objective:
Turn the current preload bridge into the sole supported renderer-native boundary.

Entry criteria:
- Phase 2 is complete or far enough along that renderer-loaded native modules are no longer required.
- `global.nativeRequire` has been removed.

Tasks:
- Move from plain `window.__INKSPACE_PRELOAD__` assignment to `contextBridge`.
- Enable `contextIsolation: true`.
- Fix renderer assumptions that rely on shared mutable globals across contexts.
- Re-verify DB open, update flow, dialogs, menus, export, and connectivity boot.

Deliverables:
- context-isolated preload bridge
- verification notes for cross-context compatibility

Success criteria:
- app boots with `contextIsolation: true`
- migrated Electron APIs still work through preload only

## Phase 5: Node Integration Reduction

Objective:
Remove renderer Node privileges after native access and context boundaries are explicit.

Entry criteria:
- Phase 4 is complete.
- Renderer no longer depends on raw `require`, filesystem access, or native bindings for boot-critical flows.

Tasks:
- Inventory remaining renderer dependencies on Node globals and modules.
- Replace direct renderer Node access with preload/main contracts where required.
- Disable `nodeIntegration` only after affected surfaces are migrated.

Deliverables:
- renderer boot path that no longer depends on Node integration

Success criteria:
- `nodeIntegration: false`
- renderer depends on explicit preload contracts only

## Phase 6: Renderer Architecture Cleanup

Objective:
Reduce implicit coupling and make state/runtime behavior more explicit.

Tasks:
- Replace global singleton access with imported service modules where practical.
- Remove `global.redirect`, `global.updateState`, and `global.getState` patterns.
- Centralize IPC contracts.
- Make app boot order more explicit in `src/index.js` and `src/main.js`.
- Isolate manager initialization from render entry where possible.

Priority targets:
- `src/components/App.js`
- `src/main.js`
- `src/index.js`
- `src/globals/NativeBridge.js`
- DB bridge consumers

Deliverables:
- clearer service boundaries
- reduced global bootstrapping
- simpler startup flow

Success criteria:
- Runtime dependencies are easier to trace and test.
- Renderer no longer depends on broad mutable globals for core behavior.

## Phase 7: State And Routing Modernization

Objective:
Remove obsolete libraries that complicate future React work.

Tasks:
- Replace `react-router-redux`.
- Replace `react-intl-redux` integration.
- Modernize store configuration incrementally.
- Decouple navigation from Redux where possible.
- Keep reducers stable while replacing the routing glue first.

Suggested order:
1. routing glue removal
2. history/router update
3. intl integration cleanup
4. Redux modernization
5. React entry modernization

Deliverables:
- routing without `react-router-redux`
- simplified store setup
- upgraded i18n integration path

Success criteria:
- App navigation works without obsolete routing bindings.
- Store bootstrapping is simpler and less upgrade-hostile.

## Phase 8: Electron Upgrade Program

Objective:
Upgrade Electron only after the app is structurally ready.

Tasks:
- Upgrade in controlled steps rather than one large jump.
- Validate:
  - app startup
  - renderer boot
  - DB worker communication
  - exports
  - sync
  - connectivity flows
  - packaging/update behavior
- Fix native compatibility issues per module audit.

Deliverables:
- upgraded Electron baseline
- validated runtime compatibility report

Success criteria:
- App runs on a supported modern Electron version without legacy renderer privileges.

## Phase 9: React And UI Modernization

Objective:
Modernize frontend patterns after the runtime is safer.

Tasks:
- Convert high-churn class components first.
- Modernize render entry.
- Introduce better local component boundaries.
- Consider visual refresh only after core runtime work is stable.

Notes:
- Do not mass-convert all components early.
- Prefer incremental conversion in touched areas.

Deliverables:
- reduced class-component surface
- modernized frontend entry patterns
- optional visual refresh backlog

Success criteria:
- UI code becomes easier to maintain without destabilizing the app.

## Milestone Backlog

## Milestone A: Foundation
- Create modernization inventory
- Create smoke-test checklist
- Define dependency risk matrix

## Milestone B: Electron Prep
- Add preload skeleton
- Replace first `remote` surfaces
- Define explicit IPC contracts

## Milestone C: Native Boundary
- Remove renderer-side native module loading
- Eliminate `global.nativeRequire`
- Re-enable renderer process reuse

## Milestone D: Native Stability
- Audit native modules
- Document rebuild flow
- Identify hard upgrade blockers

## Milestone E: Context Boundary
- Enable `contextIsolation`
- Convert preload exposure to `contextBridge`
- Verify migrated renderer/native flows

## Milestone F: Renderer Cleanup
- Reduce global boot dependencies
- Centralize bridge/service access
- Simplify app startup flow

## Milestone G: Routing/State
- Remove `react-router-redux`
- Modernize store wiring
- Replace legacy intl Redux integration

## Milestone H: Upgrade
- Upgrade Electron in steps
- Re-verify packaging, startup, DB, sync, devices

## Immediate Next Actions

1. Document the Phase 1 stopping point: `remote` removed, renderer-native module loading still present.
2. Produce a per-module migration plan for `serialport`, `usb`, `noble-mac`, and `threads`.
3. Define how each remaining renderer-loaded native module moves to main, worker, or preload/main IPC.
4. Only after that, plan `contextIsolation` enablement.
5. Treat `nodeIntegration` reduction as a later follow-up, not the next slice.

## Recommended Next Implementation Slice

1. Inventory every `nativeRequire` consumer and the native module it loads.
2. Trace which of those modules truly need renderer initiation and which can be main-owned.
3. Prototype the first migration on the highest-risk module, likely `serialport`.
4. Verify app boot and the affected device flow after each module move.
5. Delay `contextIsolation` and `nodeIntegration` changes until the native-module boundary is explicit.

## Risks

- Native modules may block Electron upgrades longer than expected.
- Device connectivity paths may depend on old Electron/Node behavior.
- Hidden runtime dependencies may surface as globals are removed.
- Worker/DB bridge behavior may break if IPC contracts are changed too broadly.
- Native modules that still load in renderer may require architectural changes rather than simple preload shims.

## Non-Goals For The First Wave

- Full React rewrite
- Full UI redesign
- Large Redux refactor
- Converting every class component
- Replacing all native dependencies at once

## Definition Of Done For Phase 1

- Preload exists.
- Active Electron renderer bridge APIs no longer use `remote`.
- No new `global.*` dependencies added.
- App still launches and completes core smoke flows.
- `enableRemoteModule` is disabled.
- Existing native-module compatibility is preserved even if renderer-native loading still exists.

## Open Questions

1. Which device workflows must be preserved and testable locally?
2. Is cloud sync considered core for every modernization milestone, or can it be deferred in some phases?
3. Is `gl` still a meaningful Electron upgrade blocker, or should it be treated as a standard native dependency with documented rebuild requirements?
4. Do we want CI introduced before any runtime migration work starts?
5. Should modernization stay behavior-preserving until Electron is upgraded, or are targeted UX improvements allowed in parallel?
6. Which renderer-native dependency should be migrated first: `serialport`, `usb`, `threads`, or `noble-mac`?
