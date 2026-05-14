/**
 * Electrobun main process entry point.
 *
 * In desktop (Electrobun) mode this file is the single entry point:
 *   1. Starts the NestJS backend on APP_PORT (55577) as a child process
 *   2. Waits for the server to become ready
 *   3. Opens a BrowserWindow pointed at http://localhost:55577
 *   4. Sets up a system-tray icon with a small control menu
 *
 * For web-service / debug mode run:
 *   cd api && npm run dev:api        (backend, port 55577)
 *   cd client && npm run dev:client  (frontend on port 55588)
 */

import { BrowserWindow, ApplicationMenu, Tray } from 'electrobun/bun';
import Electrobun from 'electrobun/bun';
import { resolve } from 'path';
import { APP_PORT } from '../../api/src/app.const';

const APP_URL = `http://localhost:${APP_PORT}`;
const ICON_PATH = 'views://assets/icon128.ico';

// __PROJECT_ROOT__ is injected at build time by electrobun.config.ts define.
// It resolves to the repo root so we can locate api/ regardless of where
// the Electrobun build places the bundled Resources/app/bun/index.js.
declare const __PROJECT_ROOT__: string;
const API_DIR = resolve(__PROJECT_ROOT__, 'api');

// Use the bundled Bun executable that Electrobun ships with the app
// instead of relying on 'bun' being on PATH.
const BUN_EXE = process.execPath;

// ── Spawn NestJS backend as a child process ──────────────────────────────────
// Running NestJS in a subprocess keeps its node_modules fully separate and
// avoids bundling NestJS's optional dynamic require() calls.
console.log('[electrobun] BUN_EXE:', BUN_EXE);
console.log('[electrobun] API_DIR:', API_DIR);
console.log('[electrobun] __PROJECT_ROOT__:', __PROJECT_ROOT__);

const logPath = resolve(API_DIR, '../nestjs-server.log');
console.log('[electrobun] NestJS log path:', logPath);

const serverProcess = Bun.spawn([BUN_EXE, 'run', 'src/main.ts'], {
  cwd: API_DIR,
  stdout: Bun.file(logPath),
  stderr: Bun.file(logPath),
});

console.log('[electrobun] NestJS subprocess PID:', serverProcess.pid);

// Monitor subprocess exit for early-exit diagnostics
serverProcess.exited.then((code) => {
  console.log('[electrobun] NestJS subprocess exited with code:', code);
});

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return; // server is up (even a 404 means it's listening)
    } catch {
      // not ready yet
    }
    await Bun.sleep(500);
  }
  throw new Error(`NestJS server did not start within ${timeoutMs / 1000}s`);
}

console.log('Waiting for NestJS server to start…');
await waitForServer(APP_URL);
console.log('NestJS server is ready');

// ── Native application menu ──────────────────────────────────────────────────
ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ label: 'Quit Timesheets Tracker', role: 'quit' }],
  },
  {
    label: 'Debug',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        action: 'toggle-devtools',
      },
      {
        label: 'Open Installation Dir',
        action: 'open-install-dir',
      },
      {
        label: 'Open Database Folder',
        action: 'open-db-dir',
      },
    ],
  },
]);

// ── Main window ──────────────────────────────────────────────────────────────
const win = new BrowserWindow({
  title: 'Timesheets Tracker',
  url: APP_URL,
  frame: {
    x: 0,
    y: 0,
    width: 1400,
    height: 900,
  },
  titleBarStyle: 'default',
});

// ── DevTools & debug actions ──────────────────────────────────────────────────
Electrobun.events.on('application-menu-clicked', (e) => {
  if (e.data.action === 'toggle-devtools') {
    win.webview.toggleDevTools();
  } else if (e.data.action === 'open-install-dir') {
    Bun.spawn(['explorer', __PROJECT_ROOT__], { cwd: __PROJECT_ROOT__ });
  } else if (e.data.action === 'open-db-dir') {
    Bun.spawn(['explorer', API_DIR], { cwd: API_DIR });
  }
});

// ── System tray ──────────────────────────────────────────────────────────────
const tray = new Tray({
  title: 'Timesheets Tracker',
  image: ICON_PATH,
  width: 32,
  height: 32,
});

const updateTrayMenu = (isWindowVisible: boolean) => {
  tray.setMenu([
    {
      type: 'normal',
      label: isWindowVisible ? 'Hide Window' : 'Show Window',
      action: 'toggle-window',
    },
    {
      type: 'normal',
      label: 'Toggle Developer Tools',
      action: 'toggle-devtools',
    },
    {
      type: 'divider',
    },
    {
      type: 'normal',
      label: 'Quit',
      action: 'quit',
    },
  ]);
};

let windowVisible = true;
updateTrayMenu(windowVisible);

tray.on('tray-clicked', (e) => {
  const { action } = e.data as { id: number; action: string };

  if (action === '' || action === 'toggle-window') {
    windowVisible = !windowVisible;
    if (windowVisible) {
      win.show();
    } else {
      win.hide();
    }
    updateTrayMenu(windowVisible);
  } else if (action === 'toggle-devtools') {
    win.webview.toggleDevTools();
  } else if (action === 'quit') {
    serverProcess.kill();
    process.exit(0);
  }
});

// Ensure NestJS is cleaned up when the Electrobun process exits
const cleanup = () => {
  try { serverProcess.kill(); } catch {}
};
process.on('exit', cleanup);
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('SIGINT', () => { cleanup(); process.exit(0); });
