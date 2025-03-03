async function updateDashboard() {
    try {
        // Update parent wallet info
        const info = await window.electronAPI.getWalletInfo();
        document.getElementById('parentPublicKey').textContent = info.public_key || 'No wallet found';
        
        // Update balance
        const balance = await window.electronAPI.getSolBalance();
        document.getElementById('parentBalance').textContent = balance.toFixed(4);

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

// Update dashboard every 30 seconds
setInterval(updateDashboard, 30000);
updateDashboard(); // Initial update
// Add the generate wallet handler
document.getElementById('generateWallet').addEventListener('click', async () => {
    try {
        if (confirm('Are you sure you want to generate a new parent wallet? This will replace the current wallet.')) {
            const result = await window.electronAPI.generateParentWallet();
            if (result.success) {
                alert('New wallet generated successfully!');
                updateDashboard();
            } else {
                throw new Error(result.error);
            }
        }
    } catch (error) {
        alert('Error generating wallet: ' + error.message);
    }
});