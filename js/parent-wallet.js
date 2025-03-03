document.addEventListener('DOMContentLoaded', async () => {
    try {
        const info = await window.electronAPI.getWalletInfo();
        document.getElementById('parentPublicKey').textContent = info.public_key;
        document.getElementById('parentPrivateKey').textContent = info.base58_private_key;
        updateBalance();
    } catch (error) {
        console.error('Error loading wallet info:', error);
    }
});

document.getElementById('togglePrivateKey').addEventListener('click', () => {
    const privateKeyElement = document.getElementById('parentPrivateKey');
    privateKeyElement.classList.toggle('visible');
    const button = document.getElementById('togglePrivateKey');
    button.textContent = privateKeyElement.classList.contains('visible') ? 'Hide Private Key' : 'Show Private Key';
});

async function updateBalance() {
    try {
        const balance = await window.electronAPI.getSolBalance();
        document.getElementById('parentBalance').textContent = balance.toFixed(4);
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

document.getElementById('setRPC').addEventListener('click', async () => {
    try {
        const endpoint = prompt('Enter RPC endpoint:', 'https://api.mainnet-beta.solana.com');
        if (endpoint) {
            await window.electronAPI.setRPCEndpoint(endpoint);
            updateBalance();
        }
    } catch (error) {
        console.error('Error setting RPC:', error);
    }
});

document.getElementById('backupWallet').addEventListener('click', async () => {
    try {
        const password = prompt('Enter password for backup (recommended for security):');
        const result = await window.electronAPI.backupWallet(password);
        if (result.success) {
            // Create a download link for the backup file
            const backupPath = result.backup_path;
            const fileName = backupPath.split('/').pop();
            
            alert(`Wallet backed up successfully! The backup file is located at: ${backupPath}\n\nPlease keep this file and your password safe.`);
        } else {
            throw new Error(result.error?.message || 'Failed to backup wallet');
        }
    } catch (error) {
        alert('Error backing up wallet: ' + error.message);
    }
});

document.getElementById('restoreWallet').addEventListener('click', async () => {
    try {
        const backupPath = prompt('Enter the path to your backup file:', 'wallets/backups/wallet_backup.json');
        if (!backupPath) return;
        
        const password = prompt('Enter backup password (leave empty if no password was used):');
        const result = await window.electronAPI.restoreWallet(backupPath, password);
        
        if (result.success) {
            alert(result.message);
            location.reload();
        } else if (result.requires_password) {
            alert('This backup requires a password. Please try again with the correct password.');
        } else {
            throw new Error(result.error?.message || 'Failed to restore wallet');
        }
    } catch (error) {
        alert('Error restoring wallet: ' + error.message);
    }
});
// Add this new event listener
document.getElementById('generateWallet').addEventListener('click', async () => {
    try {
        if (confirm('Are you sure you want to generate a new parent wallet? This will replace the current wallet.')) {
            const password = prompt('Enter a password to encrypt your wallet (leave empty for no password):');
            const result = await window.electronAPI.generateParentWallet(password);
            if (result.success) {
                alert('New wallet generated successfully!');
                location.reload();
            } else {
                throw new Error(result.error?.message || 'Failed to generate wallet');
            }
        }
    } catch (error) {
        alert('Error generating wallet: ' + error.message);
    }
});