const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI',
    {
        getWalletInfo: () => ipcRenderer.invoke('get-wallet-info'),
        getSolBalance: () => ipcRenderer.invoke('get-sol-balance'),
        getWalletCount: () => ipcRenderer.invoke('get-wallet-count'),
        getTokenBalances: () => ipcRenderer.invoke('get-token-balances'),
        getTransactionHistory: () => ipcRenderer.invoke('get-transaction-history'),
        setRPCEndpoint: (endpoint) => ipcRenderer.invoke('set-rpc-endpoint', endpoint),
        backupWallet: (password) => ipcRenderer.invoke('backup-wallet', password),
        restoreWallet: (file, password) => ipcRenderer.invoke('restore-wallet', file, password),
        generateWallets: (count) => ipcRenderer.invoke('generate-wallets', count),
        getWallets: () => ipcRenderer.invoke('get-wallets'),
        distributeSOL: (amount) => ipcRenderer.invoke('distribute-sol', amount),
        snipeToken: (mint, amount) => ipcRenderer.invoke('snipe-token', mint, amount),
        generateParentWallet: () => ipcRenderer.invoke('generate-parent-wallet')
    }
);

// Also expose Node.js process versions
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});