document.getElementById('distributeSOL').addEventListener('click', async () => {
    try {
        const amount = document.getElementById('solAmount').value;
        if (amount) {
            const results = document.getElementById('distributionResults');
            results.innerHTML = '<p>Distribution in progress...</p>';
            
            const result = await window.electronAPI.distributeSOL(parseFloat(amount));
            
            results.innerHTML = `
                <div class="distribution-summary">
                    <h3>Distribution Complete</h3>
                    <p>Successfully distributed ${amount} SOL to ${result.results.length} wallets</p>
                    <div class="transaction-list">
                        ${result.results.map(tx => `
                            <div class="transaction-item">
                                <span>Wallet: ${tx.wallet}</span>
                                <span>Signature: ${tx.signature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('distributionResults').innerHTML = 
            `<p class="error">Error: ${error.message}</p>`;
    }
});