import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export type UpdateState =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateStatus {
  state: UpdateState;
  currentVersion: string;
  availableVersion: string | null;
  percent: number | null;
  error: string | null;
  supported: boolean;
}

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', defaultPath),
  /**
   * Asks where to put a text file and writes it there in one step, returning the chosen path (or
   * null when cancelled). Unlike `saveFile`, which only hands back a path for the backend to write
   * to, the content here already lives in the renderer — a CSV it just built.
   */
  saveTextFile: (options: {
    defaultPath?: string;
    contents: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<string | null> => ipcRenderer.invoke('dialog:saveTextFile', options),
  showItemInFolder: (targetPath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', targetPath),

  updates: {
    getStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:getStatus'),
    check: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:check'),
    download: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:download'),
    install: (): Promise<boolean> => ipcRenderer.invoke('updates:install'),
    /** Subscribe to main-process status pushes; returns an unsubscribe fn. */
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, status: UpdateStatus) => callback(status);
      ipcRenderer.on('updates:status', listener);
      return () => ipcRenderer.removeListener('updates:status', listener);
    },
  },
});
