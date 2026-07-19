import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Each CI run gets its own throwaway SQLite DB directory so the suite always
// starts from a fresh install, without touching the dev DB in api/. DatabaseService
// expects this directory to already exist (Electron's userData dir always does), so
// create it up front — otherwise node:sqlite fails with "unable to open database file".
const userDataPath = path.join(os.tmpdir(), `timesheets-e2e-${process.pid}`);
fs.mkdirSync(userDataPath, { recursive: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { open: 'never', outputFolder: path.join(__dirname, '..', 'playwright-report') }], ['github']]
    : 'list',
  use: {
    baseURL: 'http://localhost:55577',
    trace: 'on-first-retry',
  },
  projects: [
    {
      // All feature specs except the database-switch flow, which needs total isolation
      // (it swaps out the single shared backend's active DB from under every other test).
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /settings-database\.spec\.ts/,
    },
    {
      // Runs only after every 'chromium' test has finished, never in parallel with it.
      name: 'chromium-db-switch',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /settings-database\.spec\.ts/,
      fullyParallel: false,
      dependencies: ['chromium'],
    },
  ],
  webServer: {
    // NOTE: api/package.json's own "start:prod" script (`node dist/main`) is stale/broken —
    // nest-cli.json's sourceRoot puts the real entry point at dist/src/main.js (this is also
    // how src/electron/main.ts launches the built api in the packaged Electron app).
    command: 'node dist/src/main',
    cwd: path.join(__dirname, '..', 'api'),
    url: 'http://localhost:55577',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      USER_DATA_PATH: userDataPath,
      DISABLE_ACTIVITY_TRACKING: 'true',
      SEED_AT_STARTUP: 'true',
      CALENDAR_FALLBACK_ICS_FILE: path.join(__dirname, 'fixtures', 'calendar-fixture.ics'),
    },
  },
});
