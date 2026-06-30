import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openDirectory'),
});
