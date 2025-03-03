from wallet_generator import WalletManager
from distribution import SolanaDistributor
from token_sniper import TokenSniper
from solana.keypair import Keypair
import asyncio
import json

async def main():
    # Initialize wallet manager and generate wallets
    wallet_manager = WalletManager()
    wallet_manager.save_wallets("wallets.json")
    print(f"Generated {len(wallet_manager.wallets)} wallets")

    # Initialize distributor
    distributor = SolanaDistributor()
    
    # Load funding wallet (replace with your wallet private key)
    funding_wallet = Keypair.from_seed(bytes.fromhex("your_private_key_here"))
    
    # Distribute SOL to child wallets (0.1 SOL each)
    distributor.distribute_sol(funding_wallet, wallet_manager.wallets, 0.1)
    
    # Initialize token sniper
    sniper = TokenSniper()
    
    # Token to snipe (replace with target token mint address)
    token_mint = "target_token_mint_address"
    
    # Snipe token with all wallets (0.05 SOL worth each)
    results = await sniper.snipe_token_all_wallets(
        wallet_manager.wallets,
        token_mint,
        0.05
    )
    
    print("Sniping completed!")

if __name__ == "__main__":
    asyncio.run(main())