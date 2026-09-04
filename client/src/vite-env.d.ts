/// <reference types="vite/client" />

interface Window {
  electron?: {
    selectDirectory: () => Promise<string | null>;
    openFile: () => Promise<string | null>;
    saveFile: (defaultPath?: string) => Promise<string | null>;
    showItemInFolder: (targetPath: string) => Promise<void>;
  };
}
