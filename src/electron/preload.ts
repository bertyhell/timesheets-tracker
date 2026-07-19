import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', defaultPath),
  showItemInFolder: (targetPath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', targetPath),
});
