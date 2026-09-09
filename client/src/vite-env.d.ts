/// <reference types="vite/client" />

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
  supported: boolean;
}

interface Window {
  electron?: {
    selectDirectory: () => Promise<string | null>;
    openFile: () => Promise<string | null>;
    saveFile: (defaultPath?: string) => Promise<string | null>;
    showItemInFolder: (targetPath: string) => Promise<void>;
    updates?: {
      getStatus: () => Promise<UpdateStatus>;
      check: () => Promise<UpdateStatus>;
      download: () => Promise<UpdateStatus>;
      install: () => Promise<boolean>;
      onStatus: (callback: (status: UpdateStatus) => void) => () => void;
    };
  };
}
