import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initializeDatabase, closeDatabase, getDatabasePath, persistDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { registerIpcHandlers } from './ipc/handlers';

// Set application name to ensure correct userData directory
app.setName('mint-fashion-pos');

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'MINT FASHION — Clothing Retail POS System',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#090d16',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  if (isDev) {
    // Development mode: try loading local Vite dev server
    const port = process.env.PORT || '5173';
    await mainWindow.loadURL(`http://localhost:${port}`).catch(async () => {
      console.log('Failed to connect to Vite dev server, falling back to built files if present...');
      const indexPath = path.join(__dirname, '../dist/index.html');
      await mainWindow?.loadFile(indexPath).catch(err => {
        console.error('Failed to load local HTML:', err);
      });
    });
  } else {
    // Production mode: load built frontend
    const indexPath = path.join(__dirname, '../dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    console.log('[MINT FASHION] Initializing SQLite database...');
    const db = await initializeDatabase();
    console.log('[MINT FASHION] Database loaded at:', getDatabasePath());

    console.log('[MINT FASHION] Running migrations & integrity check...');
    runMigrations(db);
    persistDatabase();

    console.log('[MINT FASHION] Registering IPC handlers...');
    registerIpcHandlers();

    // If test flag is passed via CLI, we can handle it
    const isTestMode = process.argv.includes('--test-persistence');
    if (isTestMode) {
      console.log('[MINT FASHION] Running in persistence test mode...');
      // If requested, can exit automatically after test
    }

    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error('[MINT FASHION] Fatal startup error:', err);
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('[MINT FASHION] Closing database cleanly...');
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
