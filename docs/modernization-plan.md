# App Modernization Plan

## Goal

Modernize `Wacom Inkspace App` in a way that reduces upgrade risk first, then improves maintainability and developer velocity.

Primary strategy:
1. Stabilize the platform and build.
2. Remove Electron upgrade blockers.
3. Untangle renderer architecture.
4. Modernize state/routing.
5. Upgrade Electron and React in controlled steps.

## Current Constraints

### Platform/runtime
- Electron `12.0.2`
- Node `14.x`
- React `17`
- Webpack `5`
- Legacy Electron renderer model with:
  - `enableRemoteModule: true`
  - `nodeIntegration: true`
  - `contextIsolation: false`

### Architectural debt
- Heavy reliance on `global.*` in renderer bootstrap and app runtime
- `remote` usage in renderer bridge code
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
- `main.js:266-270`
- `src/globals/NativeBridge.js`
- `scripts/DBBridgeRender.js`

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
Prepare for newer Electron versions by removing legacy renderer privileges.

Tasks:
- Add a `preload` script.
- Introduce `contextBridge` APIs for safe renderer access.
- Replace `remote` usage incrementally with explicit IPC contracts.
- Move window, dialog, app path, menu, and power APIs behind preload/main boundaries.
- Stop introducing new `global.*` runtime dependencies.
- Restrict or remove insecure TLS bypass behavior from dev/runtime flow.

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
- reduced `remote` dependency surface

Concrete Phase 1 checklist:
- `docs/phase-1-electron-boundary-checklist.md`

Success criteria:
- Renderer can access native capabilities without direct `remote`.
- App still boots with behavior unchanged.

## Phase 2: Build And Native Dependency Stabilization

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

## Phase 3: Renderer Architecture Cleanup

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

## Phase 4: State And Routing Modernization

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

## Phase 5: Electron Upgrade Program

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

## Phase 6: React And UI Modernization

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

## Milestone C: Native Stability
- Audit native modules
- Document rebuild flow
- Identify hard upgrade blockers

## Milestone D: Renderer Cleanup
- Reduce global boot dependencies
- Centralize bridge/service access
- Simplify app startup flow

## Milestone E: Routing/State
- Remove `react-router-redux`
- Modernize store wiring
- Replace legacy intl Redux integration

## Milestone F: Upgrade
- Upgrade Electron in steps
- Re-verify packaging, startup, DB, sync, devices

## Immediate Next Actions

1. Build a full inventory of `remote`, `global.*`, and IPC usage.
2. Produce a dependency-by-dependency upgrade matrix.
3. Define a smoke validation checklist for every modernization PR.
4. Design the preload/API boundary before touching Electron configuration.
5. Choose the first small `remote` replacement target.

## Recommended First Implementation Slice

1. Add preload skeleton.
2. Expose minimal safe APIs through preload.
3. Replace app-path and dialog access first.
4. Leave broader renderer refactors for follow-up PRs.
5. Verify no behavior change before continuing.

## Risks

- Native modules may block Electron upgrades longer than expected.
- Device connectivity paths may depend on old Electron/Node behavior.
- Hidden runtime dependencies may surface as globals are removed.
- Worker/DB bridge behavior may break if IPC contracts are changed too broadly.

## Non-Goals For The First Wave

- Full React rewrite
- Full UI redesign
- Large Redux refactor
- Converting every class component
- Replacing all native dependencies at once

## Definition Of Done For Phase 1

- Preload exists.
- First renderer-native APIs no longer use `remote`.
- No new `global.*` dependencies added.
- App still launches and completes core smoke flows.

## Open Questions

1. Which device workflows must be preserved and testable locally?
2. Is cloud sync considered core for every modernization milestone, or can it be deferred in some phases?
3. Is `gl` still a meaningful Electron upgrade blocker, or should it be treated as a standard native dependency with documented rebuild requirements?
4. Do we want CI introduced before any runtime migration work starts?
5. Should modernization stay behavior-preserving until Electron is upgraded, or are targeted UX improvements allowed in parallel?
