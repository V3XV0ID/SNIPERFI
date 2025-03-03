from solana.rpc.api import Client
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
from solana.keypair import Keypair
from typing import List
import time

class SolanaDistributor:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com"):
        self.client = Client(rpc_url)

    def distribute_sol(self, from_wallet: Keypair, target_wallets: List[Keypair], amount_per_wallet: float):
        lamports_per_wallet = int(amount_per_wallet * 10**9)
        
        for target_wallet in target_wallets:
            try:
                transaction = Transaction()
                transfer_params = TransferParams(
                    from_pubkey=from_wallet.public_key,
                    to_pubkey=target_wallet.public_key,
                    lamports=lamports_per_wallet
                )
                transaction.add(transfer(transfer_params))
                
                result = self.client.send_transaction(
                    transaction,
                    from_wallet
                )
                print(f"Distributed {amount_per_wallet} SOL to {str(target_wallet.public_key)}")
                time.sleep(0.5)  # Avoid rate limiting
                
            except Exception as e:
                print(f"Failed to distribute to {str(target_wallet.public_key)}: {str(e)}")