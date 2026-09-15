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

import { spawn, type ChildProcess } from 'child_process';
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
let apiExitCode: number | null = null;
let apiStderr = '';

function startApiServer(): ChildProcess {
  const apiScript = path.join(API_DIR, 'dist/src/main.js');

  console.log('[electron] API_DIR:', API_DIR);
  console.log('[electron] apiScript:', apiScript);

  const proc = spawn(process.execPath, [apiScript], {
    cwd: API_DIR,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      USER_DATA_PATH: app.getPath('userData'),
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data) => process.stdout.write('[api] ' + data));
  proc.stderr?.on('data', (data) => {
    process.stderr.write('[api] ' + data);
    // Keep the tail so a crash can be surfaced in the error dialog.
    apiStderr = (apiStderr + data).slice(-4000);
  });
  proc.on('exit', (code) => {
    console.log('[electron] NestJS subprocess exited with code:', code);
    apiExitCode = code ?? 0;
  });

  return proc;
}

// ── Wait for NestJS to become reachable ──────────────────────────────────────
async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // If the backend already died there is nothing left to wait for.
    if (apiExitCode !== null) {
      throw new Error(
        `The backend exited with code ${apiExitCode} before it became reachable.\n\n${apiStderr.trim()}`
      );
    }
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

// ── Auto start ───────────────────────────────────────────────────────────────
// app.get/setLoginItemSettings are macOS/Windows only — on Linux they silently
// no-op and the getter always reports false. Manage an XDG autostart entry
// instead, which is what desktop environments actually read at login.
const AUTOSTART_FILE = path.join(
  app.getPath('home'),
  '.config/autostart/timesheets-tracker.desktop'
);

/** Path to re-launch: the AppImage itself when packaged that way, else the binary. */
function autoStartExecPath(): string {
  return process.env.APPIMAGE || process.execPath;
}

function isAutoStartEnabled(): boolean {
  if (process.platform !== 'linux') {
    return app.getLoginItemSettings().openAtLogin;
  }
  try {
    // lstat, not existsSync: the entry is commonly a symlink into
    // /usr/share/applications, and a broken one should still count as "off".
    fs.lstatSync(AUTOSTART_FILE);
    return true;
  } catch {
    return false;
  }
}

function setAutoStartEnabled(enabled: boolean): void {
  if (process.platform !== 'linux') {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return;
  }

  if (!enabled) {
    try {
      fs.unlinkSync(AUTOSTART_FILE);
    } catch {
      // already absent
    }
    return;
  }

  // Exec must be quoted — the install path contains a space.
  const entry = [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Timesheets Tracker',
    'Comment=Track active window and tag programs to easily track timesheets',
    `Exec="${autoStartExecPath()}"`,
    `Icon=${app.getName().toLowerCase().replace(/\s+/g, '-')}`,
    'Terminal=false',
    'X-GNOME-Autostart-enabled=true',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(AUTOSTART_FILE), { recursive: true });
  // Replace rather than write through an existing symlink into /usr/share.
  try {
    fs.unlinkSync(AUTOSTART_FILE);
  } catch {
    // nothing to replace
  }
  fs.writeFileSync(AUTOSTART_FILE, entry, { mode: 0o644 });
}

function updateTrayMenu(): void {
  if (!tray) return;

  const isVisible = mainWindow?.isVisible() ?? false;
  const isAutoStart = isAutoStartEnabled();

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
            setAutoStartEnabled(!isAutoStart);
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
//
// Two entry points share one state machine:
//  - the periodic/tray check (`checkForUpdates`), which keeps the old behaviour
//    of downloading in the background and prompting with a dialog
//  - the Updates settings page in the renderer, which drives the check and the
//    download explicitly over IPC and renders its own progress
type UpdateState =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateStatus {
  state: UpdateState;
  currentVersion: string;
  availableVersion: string | null;
  percent: number | null;
  error: string | null;
  /** True once electron-updater is wired up (packaged builds only). */
  supported: boolean;
}

let updateStatus: UpdateStatus = {
  state: app.isPackaged ? 'idle' : 'unsupported',
  currentVersion: app.getVersion(),
  availableVersion: null,
  percent: null,
  error: null,
  supported: app.isPackaged,
};

let isManualUpdateCheck = false;
/** True while the renderer drives the flow — suppresses the native dialogs. */
let isRendererUpdateFlow = false;

function setUpdateStatus(patch: Partial<UpdateStatus>): void {
  updateStatus = { ...updateStatus, ...patch };
  mainWindow?.webContents.send('updates:status', updateStatus);
}

function setupAutoUpdater(): void {
  // The renderer decides when to download, so never download on check. The
  // periodic background check calls downloadUpdate() itself.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[electron] Checking for update...');
    setUpdateStatus({ state: 'checking', percent: null, error: null });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[electron] No update available');
    setUpdateStatus({ state: 'idle', availableVersion: null });
    if (isManualUpdateCheck && !isRendererUpdateFlow) {
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates',
        message: `You're running the latest version (${app.getVersion()}).`,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[electron] Auto-update error:', err);
    const message = err instanceof Error ? err.message : String(err);
    setUpdateStatus({ state: 'error', error: message, percent: null });
    if (isManualUpdateCheck && !isRendererUpdateFlow) {
      dialog.showErrorBox('Update Check Failed', message);
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[electron] Update available:', info.version);
    setUpdateStatus({ state: 'available', availableVersion: info.version });

    // Background checks keep the previous behaviour: fetch it right away.
    if (!isRendererUpdateFlow) {
      autoUpdater.downloadUpdate().catch((err) => {
        console.error('[electron] Failed to download update:', err);
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    setUpdateStatus({
      state: 'downloading',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    setUpdateStatus({
      state: 'downloaded',
      availableVersion: info.version,
      percent: 100,
    });

    // The settings page shows its own "Restart to install" affordance.
    if (isRendererUpdateFlow) return;

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
  isRendererUpdateFlow = false;
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

/**
 * Save-dialog + write in one call, for content the renderer already holds (the CSV export).
 * `dialog:saveFile` above stays as it is: it only returns a path, and its caller has the backend
 * do the writing.
 */
ipcMain.handle(
  'dialog:saveTextFile',
  async (
    _event,
    options: {
      defaultPath?: string;
      contents: string;
      filters?: { name: string; extensions: string[] }[];
    }
  ) => {
    const result = await dialog.showSaveDialog({
      defaultPath: options.defaultPath,
      filters: options.filters ?? [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    fs.writeFileSync(result.filePath, options.contents, 'utf-8');
    return result.filePath;
  }
);

ipcMain.handle('shell:showItemInFolder', (_event, targetPath: string) => {
  shell.showItemInFolder(targetPath);
});

ipcMain.handle('updates:getStatus', () => updateStatus);

ipcMain.handle('updates:check', async () => {
  if (!updateStatus.supported) {
    return { ...updateStatus, state: 'unsupported' as const };
  }

  isManualUpdateCheck = true;
  isRendererUpdateFlow = true;

  try {
    const result = await autoUpdater.checkForUpdates();
    // electron-updater only emits `update-available` for a newer version, so
    // the events above already moved the state machine; fall back to the check
    // result when no event fired (e.g. a cached "no update" answer).
    if (result?.isUpdateAvailable) {
      setUpdateStatus({ state: 'available', availableVersion: result.updateInfo.version });
    } else if (updateStatus.state === 'checking') {
      setUpdateStatus({ state: 'idle', availableVersion: null });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[electron] Failed to check for updates:', err);
    setUpdateStatus({ state: 'error', error: message, percent: null });
  }

  return updateStatus;
});

ipcMain.handle('updates:download', async () => {
  if (!updateStatus.supported) {
    return { ...updateStatus, state: 'unsupported' as const };
  }

  isRendererUpdateFlow = true;
  setUpdateStatus({ state: 'downloading', percent: 0, error: null });

  try {
    await autoUpdater.downloadUpdate();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[electron] Failed to download update:', err);
    setUpdateStatus({ state: 'error', error: message, percent: null });
  }

  return updateStatus;
});

ipcMain.handle('updates:install', () => {
  if (updateStatus.state !== 'downloaded') return false;
  isQuitting = true;
  // Defer so the IPC reply reaches the renderer before the app tears down.
  setImmediate(() => autoUpdater.quitAndInstall());
  return true;
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // app.quit() above is asynchronous and does not stop this module from running,
  // so a second instance would otherwise get here and spawn a rival API server
  // that cannot bind the port.
  if (!gotSingleInstanceLock) return;

  console.log('[electron] Starting NestJS API server...');
  serverProcess = startApiServer();

  console.log('[electron] Waiting for NestJS server to start...');
  try {
    await waitForServer(APP_URL);
  } catch (error) {
    // Never sit here invisibly holding the single-instance lock: a hung instance
    // with no window makes every later launch a doomed second instance.
    console.error('[electron]', error);
    dialog.showErrorBox(
      'Timesheets Tracker could not start',
      error instanceof Error ? error.message : String(error)
    );
    quit();
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
