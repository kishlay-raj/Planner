const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            // Security best practices
            sandbox: true
        },
        // Mac-specific settings
        titleBarStyle: 'hiddenInset',
        show: false // Don't show until ready
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    // Handle Picture-in-Picture / Popout Widget windows
    mainWindow.webContents.setWindowOpenHandler((details) => {
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

    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        // Dereference the window object
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();

    // On macOS, re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
