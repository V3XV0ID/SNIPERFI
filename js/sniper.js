document.getElementById('snipeToken').addEventListener('click', async () => {
    try {
        const tokenMint = document.getElementById('tokenMint').value;
        const amount = document.getElementById('amount').value;
        
        if (!tokenMint || !amount) {
            throw new Error('Please enter both token mint address and amount');
        }
        
        const results = document.getElementById('sniperResults');
        results.innerHTML = '<p>Sniping in progress...</p>';
        
        const result = await window.electronAPI.snipeToken(tokenMint, parseFloat(amount));
        
        results.innerHTML = `
            <div class="sniper-summary">
                <h3>Snipe Complete</h3>
                <p>Token: ${tokenMint}</p>
                <p>Amount: ${amount}</p>
                <div class="transaction-list">
                    ${result.results.map(tx => `
                        <div class="transaction-item">
                            <span>Wallet: ${tx.wallet}</span>
                            <span>Balance: ${tx.balance}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('sniperResults').innerHTML = 
            `<p class="error">Error: ${error.message}</p>`;
    }
});