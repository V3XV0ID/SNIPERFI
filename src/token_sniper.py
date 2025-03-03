from solana.rpc.api import Client
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
from spl.token.instructions import get_associated_token_address, create_associated_token_account
from spl.token.constants import TOKEN_PROGRAM_ID
from typing import List
import asyncio
from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
import struct
import sys
import json

class TokenSniper:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com"):
        self.client = Client(rpc_url)

    async def buy_token(self, wallet: Keypair, token_mint: str, amount: float):
        try:
            # Get token account
            token_account = await self._get_or_create_token_account(wallet, token_mint)
            
            # Create swap transaction
            transaction = await self._create_swap_transaction(
                wallet.public_key,
                token_mint,
                amount
            )
            
            # Execute swap
            result = await self.client.send_transaction(
                transaction,
                wallet
            )
            print(f"Bought token {token_mint} for wallet {str(wallet.public_key)}")
            return result
            
        except Exception as e:
            print(f"Failed to buy token: {str(e)}")
            return None

    async def snipe_token_all_wallets(self, wallets: List[Keypair], token_mint: str, amount_per_wallet: float):
        tasks = []
        for wallet in wallets:
            tasks.append(self.buy_token(wallet, token_mint, amount_per_wallet))
        return await asyncio.gather(*tasks)

    async def _get_or_create_token_account(self, wallet: Keypair, token_mint: str):
        try:
            # Get associated token account address
            ata = get_associated_token_address(wallet.public_key, token_mint)
            
            # Check if account exists
            account_info = await self.client.get_account_info(ata)
            
            if not account_info['result']['value']:
                # Create ATA if it doesn't exist
                transaction = Transaction()
                create_ata_ix = create_associated_token_account(
                    payer=wallet.public_key,
                    owner=wallet.public_key,
                    mint=token_mint
                )
                transaction.add(create_ata_ix)
                
                await self.client.send_transaction(
                    transaction,
                    wallet
                )
            
            return ata
            
        except Exception as e:
            raise Exception(f"Failed to get/create token account: {str(e)}")

    async def _create_swap_transaction(self, wallet_pubkey, token_mint: str, amount: float):
        try:
            # Create Raydium swap transaction
            transaction = Transaction()
            
            # Calculate amount in lamports
            lamports = int(amount * 10**9)
            
            # Add Raydium swap instruction
            # Note: This is a placeholder. You'll need to implement the actual
            # Raydium/Orca swap instruction based on your chosen DEX
            swap_ix = self._create_dex_swap_instruction(
                wallet_pubkey,
                token_mint,
                lamports
            )
            transaction.add(swap_ix)
            
            return transaction
            
        except Exception as e:
            raise Exception(f"Failed to create swap transaction: {str(e)}")

    def _create_dex_swap_instruction(self, wallet_pubkey, token_mint: str, lamports: int):
        # Raydium program ID
        raydium_program = PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")
        
        # Get SOL-USDC pool info (main pool for swaps)
        pool_info = self.client.get_account_info(
            PublicKey("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"),
            commitment=Confirmed
        )
        
        # Create swap instruction
        swap_instruction = self._create_raydium_swap_ix(
            wallet_pubkey,
            token_mint,
            lamports,
            pool_info['result']['value']
        )
        
        return swap_instruction

    def _create_raydium_swap_ix(self, wallet_pubkey, token_mint, amount_in, pool_info):
        # Decode pool info
        pool_authority = PublicKey("DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1")
        
        # Calculate minimum out amount (1% slippage)
        min_out_amount = int(amount_in * 0.99)
        
        # Create instruction data
        instruction_data = struct.pack(
            "<BQQQQ",
            2,  # Swap instruction
            amount_in,  # Amount in
            min_out_amount,  # Minimum amount out
            0,  # Network fee
            0   # Platform fee
        )
        
        # Required accounts for Raydium swap
        keys = [
            {"pubkey": wallet_pubkey, "isSigner": True, "isWritable": True},
            {"pubkey": pool_authority, "isSigner": False, "isWritable": False},
            {"pubkey": PublicKey(token_mint), "isSigner": False, "isWritable": True},
            {"pubkey": TOKEN_PROGRAM_ID, "isSigner": False, "isWritable": False},
        ]
        
        return TransactionInstruction(
            keys=keys,
            program_id=raydium_program,
            data=instruction_data
        )

async def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)

    try:
        token_mint = sys.argv[1]
        amount = float(sys.argv[2])
        
        # Load wallets from saved file
        with open("wallets.json", "r") as f:
            wallet_data = json.load(f)
        
        sniper = TokenSniper()
        results = await sniper.snipe_token_all_wallets(wallet_data["wallets"], token_mint, amount)
        
        response = {
            "success": True,
            "message": f"Sniped token {token_mint} with {amount} SOL per wallet",
            "results": results
        }
        print(json.dumps(response))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())