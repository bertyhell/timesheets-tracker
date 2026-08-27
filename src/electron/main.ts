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

import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const UPDATE_CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

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

// ── File logging ─────────────────────────────────────────────────────────────
// A Finder/dock launch has no terminal attached, so console output goes nowhere
// and startup failures are invisible. Mirror everything to a log file under
// userData; `npm run logs:mac` tails it.
const LOG_PATH = path.join(app.getPath('userData'), 'main.log');
let logStream: fs.WriteStream | null = null;

function initFileLogging(): void {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    // Truncate per launch: this is a startup/diagnostics log, not an audit trail.
    logStream = fs.createWriteStream(LOG_PATH, { flags: 'w' });
    logStream.on('error', () => {
      logStream = null;
    });
  } catch {
    return;
  }

  const write = (level: string, args: unknown[]): void => {
    const line = args
      .map((a) =>
        typeof a === 'string'
          ? a
          : (() => {
              try {
                return JSON.stringify(a);
              } catch {
                return String(a);
              }
            })()
      )
      .join(' ');
    logStream?.write(`${new Date().toISOString()} [${level}] ${line.replace(/\s+$/, '')}\n`);
  };

  for (const level of ['log', 'warn', 'error'] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]): void => {
      write(level, args);
      original(...args);
    };
  }

  process.on('uncaughtException', (err) => {
    console.error('[electron] uncaught exception:', err.stack ?? String(err));
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[electron] unhandled rejection:', String(reason));
  });
}

initFileLogging();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;
let isQuitting = false;

// Prevent a second launch from spawning its own NestJS server (port conflict)
// and its own dock icon/tray — focus the existing window instead.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Spawn NestJS backend as a child process ──────────────────────────────────
// Use Electron's bundled Node runtime (ELECTRON_RUN_AS_NODE) so no system Node
// installation is required in the packaged app.
// macOS: process.execPath is the app bundle's MAIN executable, and its Info.plist
// registers a regular foreground app. As soon as the API child touches AppKit
// (@paymoapp/active-window does), LaunchServices gives that child its own dock
// tile — a second, window-less icon with the same app icon. The bundled Electron
// "Helper" app has LSUIElement=1 in its Info.plist, so a process started from
// that executable never gets a dock tile. Same Node runtime, no extra icon.
function resolveNodeRuntime(): string {
  if (process.platform !== 'darwin') return process.execPath;

  const appBundle = path.resolve(path.dirname(process.execPath), '../..'); // …/Foo.app
  if (!appBundle.endsWith('.app')) return process.execPath;

  const bundleName = path.basename(appBundle, '.app');
  const helper = path.join(
    appBundle,
    'Contents/Frameworks',
    `${bundleName} Helper.app/Contents/MacOS/${bundleName} Helper`
  );

  return fs.existsSync(helper) ? helper : process.execPath;
}

// Tail of the API's stderr plus whether it died — used to explain a failed startup
// instead of hanging invisibly.
const apiErrorOutput: string[] = [];
let apiExited = false;

function startApiServer(): ChildProcess {
  const apiScript = path.join(API_DIR, 'dist/src/main.js');
  const nodeRuntime = resolveNodeRuntime();

  console.log('[electron] API_DIR:', API_DIR);
  console.log('[electron] apiScript:', apiScript);
  console.log('[electron] node runtime:', nodeRuntime);

  const proc = spawn(nodeRuntime, [apiScript], {
    cwd: API_DIR,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      USER_DATA_PATH: app.getPath('userData'),
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data) => console.log('[api]', String(data).trimEnd()));
  proc.stderr?.on('data', (data) => {
    const text = String(data).trimEnd();
    apiErrorOutput.push(text);
    // Keep only the tail — this feeds an error dialog, not a full transcript.
    if (apiErrorOutput.length > 20) apiErrorOutput.shift();
    console.error('[api]', text);
  });
  proc.on('error', (err) => {
    apiExited = true;
    apiErrorOutput.push(`failed to spawn: ${err.message}`);
    console.error('[electron] NestJS subprocess failed to spawn:', err.message);
  });
  proc.on('exit', (code) => {
    apiExited = true;
    console.log('[electron] NestJS subprocess exited with code:', code);
  });

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
    // No point waiting out the full timeout for a process that is already gone.
    if (apiExited) {
      throw new Error('The backend process exited before it started listening.');
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
          label: 'Check for Updates…',
          enabled: app.isPackaged,
          click: () => checkForUpdates(true),
        },
        { type: 'separator' },
        {
          label: 'Open Installation Dir',
          click: () =>
            shell.openPath(isDev ? path.join(__dirname, '../..') : app.getPath('userData')),
        },
        {
          label: 'Open Database Folder',
          click: () => shell.openPath(isDev ? API_DIR : app.getPath('userData')),
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

// ── Auto-update (electron-updater, GitHub releases provider) ────────────────
// Feed config is generated at build time (app-update.yml) from the `publish`
// block in electron-builder.config.js, pointing at the GitHub releases page.
let isManualUpdateCheck = false;

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[electron] Checking for update...');
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[electron] No update available');
    if (isManualUpdateCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates',
        message: `You're running the latest version (${app.getVersion()}).`,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[electron] Auto-update error:', err);
    if (isManualUpdateCheck) {
      dialog.showErrorBox('Update Check Failed', err instanceof Error ? err.message : String(err));
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[electron] Update available:', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail:
          'Restart the app to apply it now, or it will be applied automatically the next time you quit.',
      })
      .then(({ response }) => {
        if (response === 0) {
          isQuitting = true;
          autoUpdater.quitAndInstall();
        }
      });
  });
}

function checkForUpdates(manual: boolean): void {
  isManualUpdateCheck = manual;
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[electron] Failed to check for updates:', err);
    if (manual) {
      dialog.showErrorBox('Update Check Failed', err instanceof Error ? err.message : String(err));
    }
  });
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['sqlite3', 'db', 'sqlite'] }],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle('dialog:saveFile', async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultPath ?? 'timesheets-tracker-database.sqlite3',
    filters: [{ name: 'SQLite Database', extensions: ['sqlite3', 'db', 'sqlite'] }],
  });
  return result.canceled ? null : (result.filePath ?? null);
});

ipcMain.handle('shell:showItemInFolder', (_event, targetPath: string) => {
  shell.showItemInFolder(targetPath);
});

// ── Fatal startup failure ────────────────────────────────────────────────────
function reportFatalStartupError(message: string): void {
  const tail = apiErrorOutput.join('\n').trim();
  console.error('[electron] fatal startup error:', message);

  const response = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Timesheets Tracker could not start',
    message: 'The backend server did not start, so the app cannot open.',
    detail: [message, tail && `Last output:\n${tail}`, `Log file:\n${LOG_PATH}`]
      .filter(Boolean)
      .join('\n\n'),
    buttons: ['Open log file', 'Quit'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    shell.showItemInFolder(LOG_PATH);
  }

  isQuitting = true;
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  app.quit();
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log('[electron] log file:', LOG_PATH);
  console.log('[electron] Starting NestJS API server...');
  serverProcess = startApiServer();

  console.log('[electron] Waiting for NestJS server to start...');
  try {
    await waitForServer(APP_URL);
  } catch (err) {
    // Without this the rejection is silent: no window, no tray, no error — just a
    // live process the user can only kill from Activity Monitor.
    reportFatalStartupError((err as Error).message);
    return;
  }
  console.log('[electron] NestJS server is ready');

  setAppMenu();

  mainWindow = createWindow();
  tray = createTray();
  updateTrayMenu();

  if (app.isPackaged) {
    setupAutoUpdater();
    checkForUpdates(false);
    setInterval(() => checkForUpdates(false), UPDATE_CHECK_INTERVAL_MS);
  } else {
    console.log('[electron] Skipping auto-update check in development');
  }

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
