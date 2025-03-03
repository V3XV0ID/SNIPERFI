const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');

// Store window instance
let mainWindow = null;

function createWindow() {
    // Return focus if window exists
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('pages/dashboard.html');

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

    app.whenReady().then(createWindow);
}

const pythonBridge = {
    async runPythonScript(script, args) {
        return new Promise((resolve, reject) => {
            PythonShell.run(`src/${script}`, { args }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    // Dashboard Methods
    getWalletInfo: () => pythonBridge.runPythonScript('parent_wallet.py', ['info']),
    getSolBalance: () => pythonBridge.runPythonScript('parent_wallet.py', ['balance']),
    getWalletCount: () => pythonBridge.runPythonScript('wallet_generator.py', ['count']),
    getTokenBalances: () => pythonBridge.runPythonScript('parent_wallet.py', ['tokens']),
    getTransactionHistory: () => pythonBridge.runPythonScript('parent_wallet.py', ['history']),

    // Parent Wallet Methods
    setRPCEndpoint: (endpoint) => pythonBridge.runPythonScript('parent_wallet.py', ['set-rpc', endpoint]),
    backupWallet: (password) => pythonBridge.runPythonScript('parent_wallet.py', ['backup', password]),
    restoreWallet: (file, password) => pythonBridge.runPythonScript('parent_wallet.py', ['restore', file, password]),
    generateParentWallet: () => pythonBridge.runPythonScript('parent_wallet.py', ['generate']),

    // Child Wallet Methods
    generateWallets: (count) => pythonBridge.runPythonScript('wallet_generator.py', [count]),
    getWallets: () => pythonBridge.runPythonScript('wallet_generator.py', ['list']),

    // Distribution Methods
    distributeSOL: (amount) => pythonBridge.runPythonScript('distribution.py', [amount]),

    // Token Sniper Methods
    snipeToken: (mint, amount) => pythonBridge.runPythonScript('token_sniper.py', [mint, amount])
};

app.whenReady().then(() => {
    createWindow();

    // Set up IPC handlers
    ipcMain.handle('get-wallet-info', () => pythonBridge.getWalletInfo());
    ipcMain.handle('get-sol-balance', () => pythonBridge.getSolBalance());
    ipcMain.handle('get-wallet-count', () => pythonBridge.getWalletCount());
    ipcMain.handle('get-token-balances', () => pythonBridge.getTokenBalances());
    ipcMain.handle('get-transaction-history', () => pythonBridge.getTransactionHistory());
    ipcMain.handle('set-rpc-endpoint', (_, endpoint) => pythonBridge.setRPCEndpoint(endpoint));
    ipcMain.handle('backup-wallet', (_, password) => pythonBridge.backupWallet(password));
    ipcMain.handle('restore-wallet', (_, file, password) => pythonBridge.restoreWallet(file, password));
    ipcMain.handle('generate-wallets', (_, count) => pythonBridge.generateWallets(count));
    ipcMain.handle('get-wallets', () => pythonBridge.getWallets());
    ipcMain.handle('distribute-sol', (_, amount) => pythonBridge.distributeSOL(amount));
    ipcMain.handle('snipe-token', (_, mint, amount) => pythonBridge.snipeToken(mint, amount));
    ipcMain.handle('generate-parent-wallet', () => pythonBridge.generateParentWallet());
});

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