## Overview

This repository is `Wacom Inkspace App` (`3.0.8`), a desktop note-editing application built on Electron with a React/Redux renderer and Wacom-specific device, storage, and cloud integrations.

The codebase is a legacy JavaScript application with a split between Electron main-process code, a bundled renderer application, and a large `scripts/` area containing shared business logic, native bridges, connectivity layers, workers, and WILL-related code.

## Tech Stack

- Runtime: Electron `12.0.2`, Node.js `14.16.1`, npm `6.14.12`
- Main process: CommonJS JavaScript in `main.js`
- Renderer: React `17`, React DOM `17`, Redux `4`, Redux Thunk, React Router `5`, React Intl
- Bundling: Webpack `5`
- Transpilation: Babel `7` with React preset and many proposal plugins
- Styling: plain CSS bundled via `mini-css-extract-plugin` and `css-loader`
- Storage: `leveldown` + `levelup`
- Native/device integration: `serialport`, `usb`, optional `noble-mac`, local `headless-gl`
- Background/workers: `threads`

## Architecture Summary

- `main.js` runs the Electron main process, manages the app window, initializes crash reporting, connects the database, and wires startup/update behavior.
- `src/index.js` bootstraps the renderer-side globals, native bridge access, DB bridge, and device connectivity modules before calling `renderApp`.
- `src/main.js` creates the Redux store, initializes managers, loads settings/profile/device state, and renders the React application.
- `scripts/` contains most non-UI logic, including DB bridges, file utilities, device transport implementations, workers, and Wacom WILL integration.
- `project.config.js` is a central config file for environment selection, endpoints, locales, runtime flags, and webpack externals.

## Platform And Integration Areas

- Desktop target: Electron, with platform-specific behavior for macOS and Windows.
- Connectivity: USB, BLE, and SPP smart pad integrations under `scripts/connectivity/`.
- Cloud/auth: Wacom-hosted endpoints configured in `project.config.js`.
- Storage: local settings/data via LevelDB wrappers.
- Rendering/inking: Wacom WILL-related modules and workers under `scripts/WILL*` and `scripts/workers/`.
- Internationalization: locale definitions in `project.config.js` and `react-intl` usage in the renderer.

## Repo Structure

- `main.js`: Electron main process entrypoint
- `src/`: renderer application code
- `scripts/`: shared runtime logic, device connectivity, WILL engine integration, workers, DB bridges
- `webpack.config.js`: renderer bundle config
- `project.config.js`: environment, endpoints, locales, externals, app flags
- `app-scripts/`: packaging/install helper scripts
- `README.md`: setup notes, native dependency caveats, and packaging guidance

## Notable Source Areas

- `src/components/`: React UI components
- `src/actions/`, `src/reducers/`: Redux state management
- `src/globals/`: renderer-side managers and global service wrappers
- `scripts/connectivity/`: smart pad connectivity implementations
- `scripts/workers/`: worker entrypoints and background processing
- `scripts/DBBridge*`: DB access bridges for main and renderer contexts

## Dependency Notes

### Runtime dependencies

- UI/application: `react`, `react-dom`, `redux`, `react-redux`, `redux-thunk`, `react-router`, `react-router-dom`, `react-router-redux`, `react-intl`, `react-intl-redux`
- UI widgets: `rc-progress`, `rc-slider`, `rc-tooltip`, `react-tabs`, `react-notification`, `react-list`, `react-scrollbar`
- Data/utilities: `immutable`, `uuid`, `glob`, `jwt-js`, `universal-analytics`
- Imaging/file formats: `ag-psd`, `jpeg-js`, `pngjs`
- Native/platform: `leveldown`, `levelup`, `serialport`, `usb`, `threads`, `node-gyp`

### Build/dev dependencies

- Electron/tooling: `electron`, `electron-devtools-installer`, `electron-rebuild`, `electron-packager`
- Build pipeline: `webpack`, `webpack-cli`, `babel-loader`, `@babel/core`, `@babel/preset-env`, `@babel/preset-react`
- Asset/style loaders: `css-loader`, `file-loader`, `html-loader`, `ignore-loader`, `mini-css-extract-plugin`, `style-loader`
- Utilities: `concurrently`, `cross-env`, `clean-webpack-plugin`, `source-map-explorer`

### Private or nonstandard dependencies

- `cloud-js`: fetched from Bitbucket over SSH. Agent/setup work may fail without Bitbucket SSH access.
- `gl`: points to `../headless-gl`, so the sibling `headless-gl` repository must exist locally.
- `noble-mac` and `xpc-connection`: optional macOS/BLE-related dependencies from GitHub.

### Webpack/browser fallbacks

- The renderer bundle uses fallbacks for Node-oriented modules such as `path`, `crypto`, `stream`, `querystring`, and `process`.
- Several native modules are excluded from bundling and expected to resolve at runtime via Electron/node.

## Environment Requirements

- Node.js `14.16.1`
- npm `6.14.12`
- Python `2.7.16` for older native module builds
- macOS: Xcode installed
- Windows: Visual Studio 2019 plus `windows-build-tools`

## Setup Notes

1. Clone this repository.
2. Ensure Bitbucket SSH access is configured before `npm install`, because `cloud-js` is fetched over SSH.
3. Clone the `headless-gl` repository as a sibling directory at `../headless-gl`.
4. Install dependencies with `npm install`.
5. Run `./node_modules/.bin/electron-rebuild` after install and after adding native dependencies.

The existing `README.md` notes that `headless-gl` may require manual build adjustments, including updating its `binding.gyp` from `c++11` to `c++17` in that sibling repository.

## Common Commands

- `npm install`
- `./node_modules/.bin/electron-rebuild`
- `npm run dev`: webpack watch + Electron in development
- `npm run build-dev`: development webpack build
- `npm run build`: production webpack build
- `npm run start`: start Electron against the built app
- `npm run package`: package the desktop app

## Build And Packaging Notes

- `npm run dev` starts webpack in watch mode and then launches Electron.
- `npm run debug` starts Electron with the Node inspector enabled.
- `npm run build-dev` and `npm run build` produce renderer assets in `dist/`.
- `npm run start` launches Electron in production mode using local built assets.
- Packaging is handled through `app-scripts/pack.js` and `electron-packager`.

## Build And Runtime Notes

- The renderer is bundled by Webpack and targets `electron-renderer`.
- Several native modules are marked as webpack externals in `project.config.js` and are expected to resolve at runtime.
- The app uses hash-based routing via `history` and `react-router`.
- Device connectivity code lives under `scripts/connectivity/` and includes USB, BLE, and SPP variants.
- The app integrates Wacom WILL code under `scripts/WILL*`.
- Formatting is minimal and repo-local: `.prettierrc` enables tabs with `tabWidth: 4`.
- The codebase uses plain JavaScript, not TypeScript.
- The renderer relies on several globals initialized during startup, so changes to boot order should be made carefully.
- Electron is configured with legacy-style renderer integration, including `nodeIntegration: true` and `contextIsolation: false`.

## Testing And Verification

- There is no obvious automated test suite configured in `package.json`.
- Verify changes with targeted build or runtime checks when possible.
- For UI or renderer changes, prefer `npm run build-dev` or `npm run dev` if local native dependencies are available.
- For packaging or startup changes, validate through the relevant Electron startup path instead of only linting files.

## Contributor Guidance

- Keep changes compatible with the current legacy stack and avoid introducing newer framework assumptions.
- Prefer minimal changes over broad refactors unless a refactor is necessary for correctness.
- Be careful with native module upgrades; Electron, Node, and compiled dependency compatibility matter here.
- Treat `project.config.js` as a high-impact file because it controls environment endpoints, locales, feature flags, and externals.
- When dependency installation fails, check SSH access and the sibling `headless-gl` checkout before debugging application code.

## Agent Guidance

- Prefer `npm`, not `yarn` or `pnpm`; no alternate lockfile is present.
- Expect native install/build friction around `leveldown`, `serialport`, `usb`, `gl`, and BLE dependencies.
- If dependency installation fails, check for missing sibling repo `../headless-gl` and missing Bitbucket SSH credentials first.
- Keep changes compatible with the current legacy stack: Electron 12, React 17, React Router 5, Redux, Babel-transpiled JavaScript.
- Follow formatting already configured in `.prettierrc`: tabs enabled, `tabWidth: 4`.
- There is no obvious automated test suite configured in `package.json`; verify changes with targeted builds or app runs when possible.
