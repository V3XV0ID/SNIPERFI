document.addEventListener('DOMContentLoaded', async () => {
    updateWalletGrid();
});

document.getElementById('generateWallets').addEventListener('click', async () => {
    try {
        const count = document.getElementById('walletCount').value;
        if (count) {
            const result = await window.electronAPI.generateWallets(parseInt(count));
            updateWalletGrid();
        }
    } catch (error) {
        alert('Error generating wallets: ' + error.message);
    }
});

async function updateWalletGrid() {
    try {
        const wallets = await window.electronAPI.getWallets();
        const grid = document.getElementById('walletGrid');
        grid.innerHTML = '';
        
        wallets.forEach((wallet, index) => {
            const card = document.createElement('div');
            card.className = 'wallet-card';
            card.innerHTML = `
                <h4>Wallet ${index + 1}</h4>
                <p class="wallet-address">${wallet.public_key}</p>
                <p class="wallet-balance">${wallet.balance} SOL</p>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error updating wallet grid:', error);
    }
}