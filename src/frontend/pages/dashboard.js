/**
 * Dashboard page functionality
 * Handles wallet information display and updates
 */

// Cache for storing data to reduce API calls
const dataCache = {
  cache: new Map(),
  ttl: 30000, // 30 seconds
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  },
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
};

// Format balance to 4 decimal places
function formatBalance(balance) {
  return balance ? Number(balance).toFixed(4) : '0.0000';
}

/**
 * Show loading state for an element
 * @param {string} elementId - The element ID to show loading for
 */
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('loading');
    element.innerHTML = '<span class="loading-spinner"></span> Loading...';
  }
}

/**
 * Hide loading state for an element
 * @param {string} elementId - The element ID to hide loading for
 * @param {string} content - The content to display
 */
function hideLoading(elementId, content) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove('loading');
    element.innerHTML = content;
  }
}

/**
 * Update the dashboard with latest wallet information
 */
async function updateDashboard() {
  try {
    console.log("Updating dashboard...");
    
    // Show loading states
    showLoading('parentPublicKey');
    showLoading('parentBalance');
    showLoading('walletCount');
    showLoading('recentTransactions');
    showLoading('tokenHoldings');
    
    // Update parent wallet info
    let info = await window.electronAPI.getWalletInfo();
    console.log("Wallet info:", info);
    hideLoading('parentPublicKey', info && info.public_key ? info.public_key : 'No wallet found');
    
    // Update balance
    let balance = await window.electronAPI.getSolBalance();
    console.log("Balance:", balance);
    hideLoading('parentBalance', formatBalance(balance));
    
    // Update wallet count
    let wallets = await window.electronAPI.getWalletCount();
    console.log("Wallet count:", wallets);
    hideLoading('walletCount', wallets || '0');

    // Update recent transactions
    let history = await window.electronAPI.getTransactionHistory();
    console.log("Transaction history:", history);
    
    const transactionList = document.getElementById('recentTransactions');
    transactionList.innerHTML = '';
    
    if (history && history.length) {
      history.slice(0, 5).forEach(tx => {
        const txElement = document.createElement('div');
        txElement.className = 'transaction-item';
        txElement.innerHTML = `
          <span class="tx-type">${tx.type}</span>
          <span class="tx-amount">${formatBalance(tx.amount)} SOL</span>
          <span class="tx-time">${new Date(tx.timestamp).toLocaleString()}</span>
        `;
        transactionList.appendChild(txElement);
      });
    } else {
      transactionList.innerHTML = '<div class="no-data">No recent transactions</div>';
    }

    // Update token holdings
    let tokens = await window.electronAPI.getTokenBalances();
    console.log("Token balances:", tokens);
    
    const tokenList = document.getElementById('tokenHoldings');
    tokenList.innerHTML = '';
    
    if (tokens && tokens.length) {
      tokens.forEach(token => {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token-item';
        tokenElement.innerHTML = `
          <span class="token-symbol">${token.symbol}</span>
          <span class="token-balance">${token.balance}</span>
        `;
        tokenList.appendChild(tokenElement);
      });
    } else {
      tokenList.innerHTML = '<div class="no-data">No tokens found</div>';
    }
  } catch (error) {
    console.error('Error updating dashboard:', error);
    document.getElementById('errorMessage').textContent = 
      `Error updating dashboard: ${error.message}`;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing dashboard...");
  
  // Set up wallet generation button
  const generateButton = document.getElementById('generateWallet');
  if (generateButton) {
    generateButton.addEventListener('click', async () => {
      try {
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';
        
        console.log("Generating parent wallet...");
        const result = await window.electronAPI.generateParentWallet();
        console.log("Generation result:", result);
        
        if (!result || result.success === false) {
          throw new Error(result && result.error ? result.error : 'Failed to generate wallet');
        }
        
        const publicKeyElement = document.getElementById('parentPublicKey');
        const privateKeyElement = document.getElementById('parentPrivateKey');

        if (publicKeyElement) publicKeyElement.textContent = result.public_key;
        if (privateKeyElement) {
          privateKeyElement.textContent = '••••••••••••'; // Initially hide the private key
          
          // Toggle private key visibility on click
          privateKeyElement.addEventListener('click', () => {
            if (privateKeyElement.textContent === '••••••••••••') {
              privateKeyElement.textContent = result.private_key;
            } else {
              privateKeyElement.textContent = '••••••••••••';
            }
          });
        }

        alert('New wallet generated successfully!');
      } catch (error) {
        console.error("Wallet generation error:", error);
        alert('Error generating wallet: ' + error.message);
      } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Wallet';
      }
    });
  } else {
    console.error("Generate wallet button not found!");
  }
  
  // Initial dashboard update
  updateDashboard();
  
  // Set up refresh interval
  setInterval(updateDashboard, 30000);
});