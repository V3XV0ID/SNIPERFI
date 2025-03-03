// Enable hot reloading
try {
    require('electron-reloader')(module);
} catch (_) {
    console.log('Error setting up hot reloading');
}

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const windowStateKeeper = require('electron-window-state');
const config = require('./config/app.config');

// Enable hot reloading in development
try {
  require('electron-reloader')(module);
} catch (_) {
  console.log('Error setting up hot reloading');
}

// Store window instance
let mainWindow = null;

/**
 * Creates the main application window
 */
function createWindow() {
  // Return focus if window exists
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  // Load window state
  let mainWindowState = windowStateKeeper({
    defaultWidth: config.window.defaultWidth,
    defaultHeight: config.window.defaultHeight
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the main HTML file
  mainWindow.loadFile('index.html');

  // Let window state manager track window changes
  mainWindowState.manage(mainWindow);

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

/**
 * Python bridge for communicating with Python scripts
 */
const pythonBridge = {
  /**
   * Run a Python script with the given arguments
   * @param {string} script - The script filename
   * @param {Array} args - Arguments to pass to the script
   * @returns {Promise} - Promise resolving to the script output
   */
  async runPythonScript(script, args) {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'json',
        pythonPath: 'python3',
        pythonOptions: ['-u'],
        scriptPath: path.join(__dirname, 'src'),
        args
      };

      PythonShell.run(script, options, (err, results) => {
        if (err) {
          console.error(`Error running script ${script}:`, err);
          reject(new Error(`Failed to execute Python script: ${err.message}`));
        } else {
          try {
            resolve(results ? results[0] : null);
          } catch (parseError) {
            console.error('Error parsing Python script output:', parseError);
            reject(new Error('Invalid script output format'));
          }
        }
      });
    });
  },

  // Dashboard Methods
  async getWalletInfo() {
    return this.runPythonScript('parent_wallet.py', ['info']);
  },
  
  async getSolBalance() {
    return this.runPythonScript('parent_wallet.py', ['balance']);
  },
  
  async getWalletCount() {
    return this.runPythonScript('wallet_generator.py', ['count']);
  },
  
  async getTokenBalances() {
    return this.runPythonScript('parent_wallet.py', ['tokens']);
  },
  
  async getTransactionHistory() {
    return this.runPythonScript('parent_wallet.py', ['history']);
  },

  // Parent Wallet Methods
  async setRPCEndpoint(endpoint) {
    return this.runPythonScript('parent_wallet.py', ['set-rpc', endpoint]);
  },
  
  async backupWallet(password) {
    return this.runPythonScript('parent_wallet.py', ['backup', password]);
  },
  
  async restoreWallet(file, password) {
    return this.runPythonScript('parent_wallet.py', ['restore', file, password]);
  },
  
  async generateParentWallet() {
    return this.runPythonScript('parent_wallet.py', ['generate']);
  },

  // Child Wallet Methods
  async generateWallets(count) {
    return this.runPythonScript('wallet_generator.py', [count]);
  },
  
  async getWallets() {
    return this.runPythonScript('wallet_generator.py', ['list']);
  },

  // Distribution Methods
  async distributeSOL(amount) {
    return this.runPythonScript('distribution.py', [amount]);
  },

  // Token Sniper Methods
  async snipeToken(mint, amount) {
    return this.runPythonScript('token_sniper.py', [mint, amount]);
  }
};

// Set up IPC handlers when app is ready
app.whenReady().then(() => {
  createWindow();

  // Set up IPC handlers with proper error handling
  ipcMain.handle('get-wallet-info', async () => {
    try {
      return await pythonBridge.getWalletInfo();
    } catch (error) {
      console.error('Error in get-wallet-info:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-sol-balance', async () => {
    try {
      return await pythonBridge.getSolBalance();
    } catch (error) {
      console.error('Error in get-sol-balance:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-wallet-count', async () => {
    try {
      return await pythonBridge.getWalletCount();
    } catch (error) {
      console.error('Error in get-wallet-count:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-token-balances', async () => {
    try {
      return await pythonBridge.getTokenBalances();
    } catch (error) {
      console.error('Error in get-token-balances:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-transaction-history', async () => {
    try {
      return await pythonBridge.getTransactionHistory();
    } catch (error) {
      console.error('Error in get-transaction-history:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-rpc-endpoint', async (_, endpoint) => {
    try {
      return await pythonBridge.setRPCEndpoint(endpoint);
    } catch (error) {
      console.error('Error in set-rpc-endpoint:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup-wallet', async (_, password) => {
    try {
      return await pythonBridge.backupWallet(password);
    } catch (error) {
      console.error('Error in backup-wallet:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restore-wallet', async (_, file, password) => {
    try {
      return await pythonBridge.restoreWallet(file, password);
    } catch (error) {
      console.error('Error in restore-wallet:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-wallets', async (_, count) => {
    try {
      return await pythonBridge.generateWallets(count);
    } catch (error) {
      console.error('Error in generate-wallets:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-wallets', async () => {
    try {
      return await pythonBridge.getWallets();
    } catch (error) {
      console.error('Error in get-wallets:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('distribute-sol', async (_, amount) => {
    try {
      return await pythonBridge.distributeSOL(amount);
    } catch (error) {
      console.error('Error in distribute-sol:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('snipe-token', async (_, mint, amount) => {
    try {
      return await pythonBridge.snipeToken(mint, amount);
    } catch (error) {
      console.error('Error in snipe-token:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-parent-wallet', async () => {
    try {
      const result = await pythonBridge.runPythonScript('parent_wallet.py', ['generate']);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      console.error('Error generating parent wallet:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate parent wallet'
      };
    }
  });

  ipcMain.handle('generate-parent-wallet', async () => {
    try {
      const result = await pythonBridge.generateParentWallet();
      return result;
    } catch (error) {
      console.error('Error in generate-parent-wallet:', error);
      return { success: false, error: error.message };
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create a window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});