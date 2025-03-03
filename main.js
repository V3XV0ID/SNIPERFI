const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');

app.applicationSupportsSecureRestorableState = true;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
}

// Python Bridge
const pythonBridge = {
    async generateWallets(count) {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/wallet_generator.py', { args: [count] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async distributeSOL(amount) {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/distribution.py', { args: [amount] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async snipeToken(tokenMint, amount) {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/token_sniper.py', { args: [tokenMint, amount] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async getWalletInfo() {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/parent_wallet.py', { args: ['info'] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async getSolBalance() {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/parent_wallet.py', { args: ['balance'] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async setRPCEndpoint(endpoint) {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/parent_wallet.py', { args: ['set-rpc', endpoint] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    },

    async getTransactionHistory() {
        return new Promise((resolve, reject) => {
            PythonShell.run('src/parent_wallet.py', { args: ['history'] }, (err, results) => {
                if (err) reject(err);
                resolve(JSON.parse(results[0]));
            });
        });
    }
};

app.whenReady().then(() => {
    createWindow();

    // Set up IPC handlers
    ipcMain.handle('generate-wallets', async (event, count) => {
        return await pythonBridge.generateWallets(count);
    });

    ipcMain.handle('distribute-sol', async (event, amount) => {
        return await pythonBridge.distributeSOL(amount);
    });

    ipcMain.handle('snipe-token', async (event, tokenMint, amount) => {
        return await pythonBridge.snipeToken(tokenMint, amount);
    });

    ipcMain.handle('get-wallet-info', async () => {
        return await pythonBridge.getWalletInfo();
    });

    ipcMain.handle('get-sol-balance', async () => {
        return await pythonBridge.getSolBalance();
    });

    ipcMain.handle('set-rpc-endpoint', async (event, endpoint) => {
        return await pythonBridge.setRPCEndpoint(endpoint);
    });

    ipcMain.handle('get-transaction-history', async () => {
        return await pythonBridge.getTransactionHistory();
    });
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