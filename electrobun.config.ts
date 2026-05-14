import type { ElectrobunConfig } from 'electrobun';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Resolved at BUILD time and baked into the bundle via define.
// This lets the bundled bun code locate the api/ directory even though
// import.meta.dir resolves to deep inside the Electrobun build folder.
const PROJECT_ROOT = resolve('.');

export default {
  app: {
    name: 'Timesheets Tracker',
    identifier: 'com.studiohyperdrive.timesheets-tracker',
    version: pkg.version,
  },
  runtime: {
    exitOnLastWindowClosed: false, // Keep alive in system tray
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
      // Inject the project root so the subprocess can locate api/ at runtime.
      // Note: for production distribution this would need to point to the
      // installed app directory instead — that is a separate packaging concern.
      define: {
        __PROJECT_ROOT__: JSON.stringify(PROJECT_ROOT),
      },
    },
    copy: {
      'icon/icon128.ico': 'views/assets/icon128.ico',
      'icon/ico.ico': 'views/assets/icon.ico',
      'icon/icon.png': 'views/assets/icon.png',
    },
    win: {
      // Use the system WebView2 (Edge) renderer — no extra download required.
      bundleCEF: false,
      defaultRenderer: 'native',
      icon: 'icon/ico.ico',
    },
  },
  release: {
    baseUrl: '',
  },
} satisfies ElectrobunConfig;
