async function updateDashboard() {
    try {
        // Update parent wallet info
        const info = await window.electronAPI.getWalletInfo();
        const publicKeyElement = document.getElementById('parentPublicKey');
        publicKeyElement.textContent = info.public_key || 'No wallet found';
        
        // Update balance
        const balance = await window.electronAPI.getSolBalance();
        document.getElementById('parentBalance').textContent = balance ? balance.toFixed(4) : '0';
        
        // Update wallet count
        const wallets = await window.electronAPI.getWalletCount();
        document.getElementById('walletCount').textContent = wallets;

        // Update recent transactions
        const history = await window.electronAPI.getTransactionHistory();
        const transactionList = document.getElementById('recentTransactions');
        transactionList.innerHTML = '';
        
        history.slice(0, 5).forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item';
            txElement.innerHTML = `
                <span class="tx-type">${tx.type}</span>
                <span class="tx-amount">${tx.amount} SOL</span>
                <span class="tx-time">${new Date(tx.timestamp).toLocaleString()}</span>
            `;
            transactionList.appendChild(txElement);
        });

        // Update token holdings
        const tokens = await window.electronAPI.getTokenBalances();
        const tokenList = document.getElementById('tokenHoldings');
        tokenList.innerHTML = '';
        
        tokens.forEach(token => {
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token-item';
            tokenElement.innerHTML = `
                <span class="token-symbol">${token.symbol}</span>
                <span class="token-balance">${token.balance}</span>
            `;
            tokenList.appendChild(tokenElement);
        });
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Single event listener for generate wallet button
// Remove any duplicate event listeners and use this single one
document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateWallet');
    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.generateParentWallet();
                if (result.success) {
                    const message = `Wallet Generated Successfully!\n\n` +
                        `Public Key:\n${result.public_key}\n\n` +
                        `Private Key:\n${result.private_key}\n\n` +
                        `SAVE THIS PRIVATE KEY NOW! It won't be shown again!`;
                    alert(message);
                    updateDashboard();
                } else {
                    throw new Error(result.error || 'Failed to generate wallet');
                }
            } catch (error) {
                console.error('Generation error:', error);
                alert('Error generating wallet: ' + error.message);
            }
        });
    }
    
    updateDashboard();
    setInterval(updateDashboard, 30000);
});