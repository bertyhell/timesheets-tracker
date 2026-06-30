/**
 * Electron main process entry point.
 *
 * 1. Spawns the NestJS backend on APP_PORT (55577) as a child process
 * 2. Waits for the server to become ready
 * 3. Opens a BrowserWindow pointed at http://localhost:55577
 * 4. Sets up a system-tray icon with a control menu
 *
 * For web-service / debug mode run separately:
 *   cd api && npm run dev:api        (backend, port 55577)
 *   cd client && npm run dev:client  (frontend on port 55588)
 */

import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Tray, nativeImage, shell } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

const APP_PORT = 55577;
const APP_URL = `http://localhost:${APP_PORT}`;

// In development (running via `electron .` after tsc), app.isPackaged is false.
// __dirname resolves to src/electron/dist/, so API and icons are at ../../
const isDev = !app.isPackaged;

const API_DIR = isDev ? path.join(__dirname, '../../api') : path.join(process.resourcesPath, 'api');

const ICON_PATH = isDev
  ? path.join(__dirname, '../../icon/icon.png')
  : path.join(process.resourcesPath, 'icon/icon.png');

const PRELOAD_PATH = path.join(__dirname, 'preload.js');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;
let isQuitting = false;

// ── Spawn NestJS backend as a child process ──────────────────────────────────
// Use Electron's bundled Node runtime (ELECTRON_RUN_AS_NODE) so no system Node
// installation is required in the packaged app.
function startApiServer(): ChildProcess {
  const apiScript = path.join(API_DIR, 'dist/src/main.js');

  console.log('[electron] API_DIR:', API_DIR);
  console.log('[electron] apiScript:', apiScript);

  const proc = spawn(process.execPath, [apiScript], {
    cwd: API_DIR,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data) => process.stdout.write('[api] ' + data));
  proc.stderr?.on('data', (data) => process.stderr.write('[api] ' + data));
  proc.on('exit', (code) => console.log('[electron] NestJS subprocess exited with code:', code));

  return proc;
}

// ── Wait for NestJS to become reachable ──────────────────────────────────────
async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`NestJS server did not start within ${timeoutMs / 1000}s`);
}

// ── Create the main browser window ──────────────────────────────────────────
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    title: 'Timesheets Tracker',
    width: 1400,
    height: 900,
    show: true,
    icon: ICON_PATH,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
  });

  win.loadURL(APP_URL);

  // Hide to tray on close instead of quitting
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
      updateTrayMenu();
    }
  });

  return win;
}

// ── System tray ──────────────────────────────────────────────────────────────
function createTray(): Tray {
  const icon = nativeImage.createFromPath(ICON_PATH);
  const t = new Tray(icon.resize({ width: 16, height: 16 }));
  t.setToolTip('Timesheets Tracker');

  // Left-click toggles window (mainly useful on Windows/Linux)
  t.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
    updateTrayMenu();
  });

  return t;
}

function updateTrayMenu(): void {
  if (!tray) return;

  const isVisible = mainWindow?.isVisible() ?? false;
  const isAutoStart = app.getLoginItemSettings().openAtLogin;

  // Fetch tracking state then rebuild menu
  fetch(`${APP_URL}/api/programs/tracking`)
    .then((r) => r.json())
    .catch(() => ({ isTracking: false }))
    .then(({ isTracking }: { isTracking: boolean }) => {
      if (!tray) return;

      const menu = Menu.buildFromTemplate([
        {
          label: isVisible ? 'Hide Window' : 'Show Window',
          click: () => {
            if (isVisible) {
              mainWindow?.hide();
            } else {
              mainWindow?.show();
              mainWindow?.focus();
            }
            updateTrayMenu();
          },
        },
        { type: 'separator' },
        {
          label: 'Auto Start',
          type: 'checkbox',
          checked: isAutoStart,
          click: () => {
            const next = !isAutoStart;
            app.setLoginItemSettings({ openAtLogin: next });
            updateTrayMenu();
          },
        },
        {
          label: 'Track Activity',
          type: 'checkbox',
          checked: isTracking,
          click: () => {
            fetch(`${APP_URL}/api/programs/tracking`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: !isTracking }),
            }).then(() => updateTrayMenu());
          },
        },
        { type: 'separator' },
        {
          label: 'Open Installation Dir',
          click: () =>
            shell.openPath(isDev ? path.join(__dirname, '../..') : app.getPath('userData')),
        },
        {
          label: 'Open Database Folder',
          click: () => shell.openPath(API_DIR),
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => quit(),
        },
      ]);

      tray.setContextMenu(menu);
    });
}

// ── Application menu ──────────────────────────────────────────────────────────
function setAppMenu(): void {
  // Remove the native menu bar — all options live in the tray right-click menu.
  Menu.setApplicationMenu(null);

  // Keep the DevTools shortcut working without a menu bar.
  app.whenReady().then(() => {
    globalShortcut.register('CmdOrCtrl+Shift+I', () => {
      mainWindow?.webContents.toggleDevTools();
    });
  });
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
function quit(): void {
  isQuitting = true;
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  app.quit();
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log('[electron] Starting NestJS API server...');
  serverProcess = startApiServer();

  console.log('[electron] Waiting for NestJS server to start...');
  await waitForServer(APP_URL);
  console.log('[electron] NestJS server is ready');

  setAppMenu();

  mainWindow = createWindow();
  tray = createTray();
  updateTrayMenu();

  app.on('activate', () => {
    // macOS: re-show window when dock icon is clicked
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// Keep process alive for the tray (don't quit when last window closes)
app.on('window-all-closed', () => {
  // intentionally empty — app lives in the tray
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
});
