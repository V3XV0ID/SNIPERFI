/**
 * Application configuration
 * Centralizes all configuration settings
 */
module.exports = {
  app: {
    name: 'SNIPERFI',
    version: '1.0.0'
  },
  window: {
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 800,
    minHeight: 600
  },
  python: {
    scriptPath: 'src',
    timeout: 30000
  },
  wallet: {
    directory: 'wallets',
    parentFile: 'parent_wallet.json',
    backupDir: 'backups',
    refreshInterval: 30000,
    maxRetries: 3
  },
  rpc: {
    defaultEndpoint: 'https://api.devnet.solana.com',
    timeout: 30000
  },
  security: {
    encryptionIterations: 100000,
    saltSize: 16
  }
};