
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('architecturiaUpdater', {
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),

  downloadUpdate: () => ipcRenderer.invoke('updater:download'),

  installUpdate: () => ipcRenderer.invoke('updater:install'),

  onStatus: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const listener = (_event, status) => callback(status);

    ipcRenderer.on('updater:status', listener);

    return () => {
      ipcRenderer.removeListener('updater:status', listener);
    };
  }
});
