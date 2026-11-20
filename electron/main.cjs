
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

let mainWindow = null;
let updateDownloaded = false;
let checkInProgress = false;
let downloadInProgress = false;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Les mises à jour restent entièrement manuelles.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowPrerelease = false;
autoUpdater.crossOriginHeaders = () => [];

function sendUpdateStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', status);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#101318',
    title: 'ZONE-431 DESIGN',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Événements du système de mise à jour.
autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus({
    state: 'checking',
    message: 'Recherche des mises à jour...'
  });
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus({
    state: 'available',
    message: 'Une nouvelle version est disponible.',
    version: info.version
  });
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus({
    state: 'not-available',
    message: 'Architecturia est déjà à jour.'
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus({
    state: 'downloading',
    message: 'Téléchargement de la mise à jour...',
    percent: Math.round(progress.percent)
  });
});

autoUpdater.on('update-downloaded', (info) => {
  updateDownloaded = true;

  sendUpdateStatus({
    state: 'downloaded',
    message: 'Mise à jour téléchargée. Elle est prête à être installée.',
    version: info.version
  });
});

autoUpdater.on('error', (error) => {
  checkInProgress = false;
  downloadInProgress = false;

  log.error('Erreur du système de mise à jour :', error);

  sendUpdateStatus({
    state: 'error',
    message: 'Impossible de récupérer la mise à jour.',
    details: error.message
  });
});

// Communication sécurisée avec l'interface.
ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) {
    return {
      state: 'development',
      message: 'Les mises à jour sont disponibles uniquement dans la version installée.'
    };
  }

  if (checkInProgress) {
    return {
      state: 'checking',
      message: 'Une recherche est déjà en cours.'
    };
  }

  try {
    checkInProgress = true;
    await autoUpdater.checkForUpdates();

    return { state: 'started' };
  } catch (error) {
    log.error(error);

    return {
      state: 'error',
      message: 'La recherche des mises à jour a échoué.'
    };
  } finally {
    checkInProgress = false;
  }
});

ipcMain.handle('updater:download', async () => {
  if (!app.isPackaged) {
    return { state: 'development' };
  }

  if (downloadInProgress || updateDownloaded) {
    return { state: 'unavailable' };
  }

  try {
    downloadInProgress = true;
    await autoUpdater.downloadUpdate();

    return { state: 'started' };
  } catch (error) {
    log.error(error);

    sendUpdateStatus({
      state: 'error',
      message: 'Le téléchargement de la mise à jour a échoué.',
      details: error.message
    });

    return { state: 'error' };
  } finally {
    downloadInProgress = false;
  }
});

ipcMain.handle('updater:install', () => {
  if (!app.isPackaged || !updateDownloaded) {
    return { state: 'unavailable' };
  }

  autoUpdater.quitAndInstall(false, true);
  return { state: 'installing' };
});

app.whenReady().then(() => {
  createWindow();

  // Première recherche automatique, sans télécharger la mise à jour.
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch((error) => {
        log.error('Recherche automatique impossible :', error);
      });
    }
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
