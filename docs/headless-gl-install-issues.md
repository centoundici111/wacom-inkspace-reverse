# Headless-GL Install And Rebuild Notes

## Summary

This note captures what happened while switching the app from a local `../headless-gl` checkout to the published npm package `gl@6.0.2`.

## What Changed

- `package.json` was updated from `"gl": "../headless-gl"` to `"gl": "6.0.2"`
- `README.md` was updated to remove the sibling checkout and manual `binding.gyp` patch instructions

## Why `gl@6.0.2`

- the latest published `gl` release requires newer Node versions than this app currently uses
- `gl@6.0.2` declares `node >=14`, which matches the current Node/Electron baseline better
- upstream `v6.0.2` already includes `c++17` in its macOS Xcode build settings

## Issues Encountered

## 1. Existing workspace still pointed at the sibling checkout

What happened:
- `npm ls gl` showed `gl@4.9.0` as an invalid install linked to the old local `../headless-gl` path

Why:
- the workspace had previously installed the local path dependency, so `node_modules/gl` was still tied to the sibling checkout

Resolution:
- installing `gl@6.0.2` replaced that old linked dependency

## 2. `electron-rebuild` looked present but was not actually installed

What happened:
- `node_modules/.bin/electron-rebuild` existed, but running it initially failed because the underlying package directory was missing

Why:
- there was a stale binary symlink left in `node_modules/.bin`
- the actual `electron-rebuild` package was not present in the current workspace state

Resolution:
- install or restore `electron-rebuild` before using it

## 3. Full `npm install` failed on an unrelated native install script

What happened:
- a full `npm install` failed in `lzma-native`

Error pattern:
- `lzma-native@6.0.1 install: node-pre-gyp install --fallback-to-build && rimraf build`
- `sh: rimraf: command not found`

Why:
- this was unrelated to `gl`
- the install script expected `rimraf` during execution and the current dependency state did not satisfy that script cleanly

Resolution:
- avoid using the full reinstall as the main verification path for this change
- install the missing rebuild tooling directly and continue with targeted validation

## 4. `electron-rebuild` failed because ANGLE invoked `python`

What happened:
- rebuilding `gl` for Electron 12 started correctly, then failed with:
- `/bin/sh: python: command not found`
- `gyp: Call to 'python commit_id.py check ..' returned exit status 127`

Why:
- `node-gyp` itself found `python3`
- but a deeper ANGLE build step inside `gl` still invoked `python`
- on this machine, `python` was not available as a command, only `python3`

Resolution:
- a temporary shim named `python` was created in temp space and pointed to the system `python3`
- `electron-rebuild` was then rerun with that shim prepended to `PATH`

Important:
- this was a verification workaround only
- it did not change global shell config or system Python setup

## 5. Rebuild succeeded, but plain Node could no longer load `gl`

What happened:
- after `electron-rebuild`, `node -e "require('gl')"` failed with a module ABI mismatch

Error pattern:
- module compiled against `NODE_MODULE_VERSION 87`
- current Node runtime expected `NODE_MODULE_VERSION 83`

Why:
- after `electron-rebuild`, native modules are rebuilt for Electron's Node ABI, not the standalone Node ABI
- this is expected for Electron-native dependencies

Resolution:
- treat plain Node loading as the wrong validation target after rebuild
- validate the module from the Electron runtime instead

## Verification Outcome

Successful outcomes:
- `gl@6.0.2` installed successfully from npm
- `electron-rebuild` completed successfully after the temporary `python` shim workaround

Warnings observed during rebuild:
- multiple compiler warnings from ANGLE and native bindings
- one linker warning:
  - `search path '.../node_modules/gl/deps/darwin' not found`

Status:
- rebuild completed successfully despite warnings
- the remaining important validation step is an end-to-end app export smoke test

## Recommended Follow-Up

1. Run one real Electron export flow:
- preview generation
- layer preview generation
- PNG export

2. Use the repo-local rebuild wrapper:
- `npm run electron-rebuild`
- this command adds a temporary `python -> python3` shim when needed and then runs the local `electron-rebuild` CLI

3. The repo now also triggers rebuild automatically from `postinstall` when Electron and native dependencies are present.

4. Run one real Electron export flow after rebuild so the app path is validated, not just the native compile step.

## Practical Takeaway

The local sibling `headless-gl` checkout is no longer technically required for this repo.

The main remaining caveat is not `headless-gl` itself, but the Electron rebuild environment for `gl`, specifically the `python` vs `python3` expectation during ANGLE compilation on this machine. The repo now includes a local wrapper for that case via `npm run electron-rebuild`, and `postinstall` runs that wrapper automatically unless `SKIP_ELECTRON_REBUILD=1` is set.
