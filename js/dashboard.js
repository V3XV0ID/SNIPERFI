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
    document.getElementById('generateWallet').addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.generateParentWallet();
            if (result.success) {
                const publicKeyElement = document.getElementById('parentPublicKey');
                const privateKeyElement = document.getElementById('parentPrivateKey');
    
                publicKeyElement.textContent = result.public_key;
                privateKeyElement.textContent = '************'; // Initially hide the private key
    
                privateKeyElement.addEventListener('click', () => {
                    privateKeyElement.textContent = result.private_key; // Reveal private key on click
                });
    
                alert('New wallet generated successfully!');
            } else {
                throw new Error(result.error || 'Failed to generate wallet');
            }
        } catch (error) {
            alert('Error generating wallet: ' + error.message);
        }
    });
    
    updateDashboard();
    setInterval(updateDashboard, 30000);
});