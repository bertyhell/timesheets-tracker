/// <reference types="vite/client" />

declare module 'plotly.js-dist-min';

interface Window {
  electron?: {
    selectDirectory: () => Promise<string | null>;
    openFile: () => Promise<string | null>;
    saveFile: (defaultPath?: string) => Promise<string | null>;
    showItemInFolder: (targetPath: string) => Promise<void>;
  };
}
