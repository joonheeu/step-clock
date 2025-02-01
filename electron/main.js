const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let settingsWindow = null;
let tray = null;
let currentTimer = null;

function getStoredWindowSize() {
    const defaultSize = {
        width: 300,
        height: 450,
        minWidth: 250,
        minHeight: 400,
        maxWidth: 500,
        maxHeight: 800
    };
    return store.get('windowSize', defaultSize);
}

function createWindow() {
    const windowSize = getStoredWindowSize();
    
    mainWindow = new BrowserWindow({
        ...windowSize,
        show: false,
        frame: false,
        resizable: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.on('blur', () => {
        if (!settingsWindow || !settingsWindow.isFocused()) {
            mainWindow.hide();
        }
    });

    mainWindow.on('resize', () => {
        const [width, height] = mainWindow.getSize();
        store.set('windowSize.width', width);
        store.set('windowSize.height', height);
    });

    return mainWindow;
}

function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    const windowSize = getStoredWindowSize();
    
    settingsWindow = new BrowserWindow({
        width: windowSize.width,
        height: windowSize.height,
        show: false,
        frame: false,
        resizable: true,
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    settingsWindow.loadFile(path.join(__dirname, '../src/settings.html'));

    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

function showWindow() {
    if (!mainWindow) {
        createWindow();
    }

    const trayBounds = tray.getBounds();
    const windowBounds = mainWindow.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    let y = Math.round(trayBounds.y + trayBounds.height);

    // 화면 경계 확인
    if (x + windowBounds.width > width) {
        x = width - windowBounds.width;
    }
    if (x < 0) {
        x = 0;
    }

    mainWindow.setPosition(x, y);
    mainWindow.show();
    mainWindow.focus();
}

function createTray() {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    tray = new Tray(iconPath);
    tray.setToolTip('StepClock');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
                showWindow();
            }
        },
        {
            label: '설정',
            click: () => {
                createSettingsWindow();
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.on('click', () => {
        if (mainWindow && mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            showWindow();
        }
    });

    tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu);
    });
}

app.whenReady().then(() => {
    createTray();
    createWindow();

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

// IPC 이벤트 핸들러
ipcMain.on('show-settings', () => {
    createSettingsWindow();
});

ipcMain.on('settings-updated', (event, settings) => {
    store.set('timerSettings', settings.timerSettings);
    
    if (settings.windowSize) {
        const { width, height, minWidth, minHeight, maxWidth, maxHeight } = settings.windowSize;
        mainWindow.setMinimumSize(minWidth, minHeight);
        mainWindow.setMaximumSize(maxWidth, maxHeight);
        mainWindow.setSize(width, height);
        store.set('windowSize', settings.windowSize);
    }
});

ipcMain.on('start-timer', (event, duration) => {
    currentTimer = duration;
    tray.setToolTip(`StepClock - ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
});

ipcMain.on('pause-timer', () => {
    if (currentTimer) {
        tray.setToolTip('StepClock - 일시정지됨');
    }
});

ipcMain.on('stop-timer', () => {
    currentTimer = null;
    tray.setToolTip('StepClock');
});

ipcMain.on('update-timer', (event, { id, duration }) => {
    if (currentTimer) {
        currentTimer = duration;
        tray.setToolTip(`StepClock - ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
    }
});

ipcMain.on('update-tray', (event, data) => {
    if (data) {
        const { index, total, time, name } = data;
        tray.setToolTip(`StepClock - ${index}/${total}\n${name}\n${time}`);
    } else {
        tray.setToolTip('StepClock');
    }
}); 