// Update parent wallet info
async function updateParentWalletInfo() {
    try {
        const info = await window.electronAPI.getWalletInfo();
        document.getElementById('parentPublicKey').innerText = info.public_key;
        const balance = await window.electronAPI.getSolBalance();
        document.getElementById('parentBalance').innerText = balance.toFixed(4);
    } catch (error) {
        console.error('Error updating wallet info:', error);
    }
}

// Initialize wallet info on load
document.addEventListener('DOMContentLoaded', updateParentWalletInfo);

document.getElementById('setRPC').addEventListener('click', async () => {
    try {
        const endpoint = prompt('Enter RPC endpoint:', 'https://api.mainnet-beta.solana.com');
        if (endpoint) {
            const result = await window.electronAPI.setRPCEndpoint(endpoint);
            document.getElementById('results').innerText = JSON.stringify(result, null, 2);
            updateParentWalletInfo();
        }
    } catch (error) {
        document.getElementById('results').innerText = `Error: ${error.message}`;
    }
});

document.getElementById('generateWallets').addEventListener('click', async () => {
    try {
        const count = document.getElementById('walletCount').value;
        if (count) {
            const result = await window.electronAPI.generateWallets(parseInt(count));
            document.getElementById('results').innerText = JSON.stringify(result, null, 2);
        }
    } catch (error) {
        document.getElementById('results').innerText = `Error: ${error.message}`;
    }
});

document.getElementById('distributeSOL').addEventListener('click', async () => {
    try {
        const amount = document.getElementById('solAmount').value;
        if (amount) {
            const result = await window.electronAPI.distributeSOL(parseFloat(amount));
            document.getElementById('results').innerText = JSON.stringify(result, null, 2);
            updateParentWalletInfo(); // Update balance after distribution
        }
    } catch (error) {
        document.getElementById('results').innerText = `Error: ${error.message}`;
    }
});

document.getElementById('snipeToken').addEventListener('click', async () => {
    try {
        const tokenMint = document.getElementById('tokenMint').value;
        const amount = parseFloat(document.getElementById('amount').value);
        
        if (!tokenMint || !amount) {
            throw new Error('Please enter both token mint address and amount');
        }
        
        const result = await window.electronAPI.snipeToken(tokenMint, amount);
        document.getElementById('results').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('results').innerText = `Error: ${error.message}`;
    }
});

// Update transaction history
async function updateHistory() {
    try {
        const history = await window.electronAPI.getTransactionHistory();
        const historyDiv = document.getElementById('history');
        historyDiv.innerHTML = '';
        
        history.forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'history-item';
            txElement.innerHTML = `
                <p><strong>Type:</strong> ${tx.type}</p>
                <p><strong>Time:</strong> ${new Date(tx.timestamp).toLocaleString()}</p>
                <p><strong>Details:</strong> ${JSON.stringify(tx.details)}</p>
            `;
            historyDiv.appendChild(txElement);
        });
    } catch (error) {
        console.error('Error updating history:', error);
    }
}

// Update history every 30 seconds
setInterval(updateHistory, 30000);
updateHistory(); // Initial update