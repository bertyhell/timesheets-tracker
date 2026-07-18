# Project Notes

## Architecture

- The app must always work as a standalone NestJS service + frontend client (outside of Electron), and also work inside Electron.
- Electron-specific code (e.g. `window.electron`) must always be guarded so the app degrades gracefully in a plain browser context.

## Chrome extension

- Any change to `chrome-extension/` must bump the patch version (+1) in both `chrome-extension/manifest.json` and `chrome-extension/manifest-prd.json`.
