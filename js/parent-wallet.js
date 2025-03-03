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
        const password = prompt('Enter password for backup:');
        if (password) {
            const result = await window.electronAPI.backupWallet(password);
            alert(result.message);
        }
    } catch (error) {
        alert('Error backing up wallet: ' + error.message);
    }
});

document.getElementById('restoreWallet').addEventListener('click', async () => {
    try {
        const password = prompt('Enter backup password:');
        if (password) {
            const result = await window.electronAPI.restoreWallet('wallet_backup.json', password);
            alert(result.message);
            location.reload();
        }
    } catch (error) {
        alert('Error restoring wallet: ' + error.message);
    }
});
// Add this new event listener
document.getElementById('generateWallet').addEventListener('click', async () => {
    try {
        if (confirm('Are you sure you want to generate a new parent wallet? This will replace the current wallet.')) {
            const result = await window.electronAPI.generateParentWallet();
            if (result.success) {
                alert('New wallet generated successfully!');
                location.reload();
            } else {
                throw new Error(result.error);
            }
        }
    } catch (error) {
        alert('Error generating wallet: ' + error.message);
    }
});