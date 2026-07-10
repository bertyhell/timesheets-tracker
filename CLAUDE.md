# Project Notes

## Development

- Never start or run the app — the user verifies changes themselves.

## Architecture

- The app must always work as a standalone NestJS service + frontend client (outside of Electron), and also work inside Electron.
- Electron-specific code (e.g. `window.electron`) must always be guarded so the app degrades gracefully in a plain browser context.
