const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Wallet Management
    getWalletInfo: () => ipcRenderer.invoke('get-wallet-info'),
    getSolBalance: () => ipcRenderer.invoke('get-sol-balance'),
    setRPCEndpoint: (endpoint) => ipcRenderer.invoke('set-rpc-endpoint', endpoint),
    
    // Wallet Generation and Distribution
    generateWallets: (count) => ipcRenderer.invoke('generate-wallets', count),
    distributeSOL: (amount) => ipcRenderer.invoke('distribute-sol', amount),
    
    // Token Operations
    snipeToken: (tokenMint, amount) => ipcRenderer.invoke('snipe-token', tokenMint, amount),
    getTokenBalances: () => ipcRenderer.invoke('get-token-balances'),
    
    // Transaction History
    getTransactionHistory: () => ipcRenderer.invoke('get-transaction-history'),
    
    // Backup and Restore
    backupWallet: (password) => ipcRenderer.invoke('backup-wallet', password),
    restoreWallet: (backupFile, password) => ipcRenderer.invoke('restore-wallet', backupFile, password)
});