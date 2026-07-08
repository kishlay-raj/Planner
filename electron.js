const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple apps; consider true + preload for security in production
    },
  });

  // Handle Picture-in-Picture / Popout Widget windows
  win.webContents.setWindowOpenHandler((details) => {
    const isPip = details.frameName === 'PomodoroWidget' || 
                  (details.features && (
                      details.features.includes('picture-in-picture') || 
                      details.features.includes('pip') || 
                      (details.features.includes('width=320') && details.features.includes('height=180'))
                  ));
    if (isPip) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 320,
          height: 180,
          frame: false,
          alwaysOnTop: true,
          resizable: false,
          minimizable: false,
          maximizable: false,
          fullscreenable: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      };
    }
    return { action: 'allow' };
  });

  // Load the index.html from a url in dev or local file in prod
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'build/index.html')}`
  );

  // Open the DevTools in dev mode
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. directly mirroring typical mac app behavior.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
