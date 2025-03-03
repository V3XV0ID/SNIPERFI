const { spawn } = require('child_process');
const electron = require('electron');
require('electron-reloader')(module);

// Start Electron app
const electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
    electronProcess.kill();
    process.exit();
});