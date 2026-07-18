/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.studiohyperdrive.timesheets-tracker',
  productName: 'Timesheets Tracker',
  copyright: 'Copyright © Bert Verhelst',

  directories: {
    output: 'release',
  },

  // electron-builder defaults GitHub releases to releaseType: 'draft'; publish
  // live so tagging a release immediately makes binaries available on the page.
  publish: {
    provider: 'github',
    releaseType: 'release',
  },

  // Files included in the app.asar (main process only)
  files: ['src/electron/dist/**/*', 'icon/**/*', 'package.json'],

  // API (NestJS) and built client live outside the asar so native modules work
  extraResources: [
    {
      from: 'icon',
      to: 'icon',
    },
    {
      from: 'api',
      to: 'api',
      filter: [
        'dist/**',
        'package.json',
        '!**/*.map',
        '!**/*.d.ts',
      ],
    },
    // node_modules must be a separate entry so electron-builder doesn't apply
    // api/.gitignore (which excludes /node_modules) to this copy step.
    {
      from: 'api/node_modules',
      to: 'api/node_modules',
      filter: ['**', '!.cache/**', '!**/*.map'],
    },
    {
      from: 'client/dist',
      to: 'client/dist',
    },
  ],

  // ── Windows ──────────────────────────────────────────────────────────────
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'icon/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'icon/icon.ico',
    uninstallerIcon: 'icon/icon.ico',
  },

  // ── macOS ─────────────────────────────────────────────────────────────────
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'icon/icon.png',
    category: 'public.app-category.productivity',
    // Keep running in tray after closing last window
    extendInfo: {
      LSUIElement: false,
      NSRequiresAquaSystemAppearance: false,
    },
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },

  // ── Linux ─────────────────────────────────────────────────────────────────
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    icon: 'icon/icon.png',
    category: 'Utility',
  },
};
