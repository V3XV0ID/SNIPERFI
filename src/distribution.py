from solana.rpc.api import Client
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
import json
import sys
import asyncio

async def distribute_sol(amount):
    try:
        with open('wallets.json', 'r') as f:
            wallets = json.load(f)
        
        client = Client("https://api.mainnet-beta.solana.com")
        lamports = int(amount * 1e9)
        
        results = []
        for wallet_data in wallets:
            wallet = Keypair.from_secret_key(bytes(wallet_data['private_key']))
            tx = Transaction()
            tx.add(transfer(TransferParams(
                from_pubkey=wallet.public_key,
                to_pubkey=wallet.public_key,
                lamports=lamports
            )))
            
            result = await client.send_transaction(tx, wallet)
            results.append({
                'wallet': str(wallet.public_key),
                'signature': result['result']
            })
        
        return {'success': True, 'results': results}
        
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    amount = float(sys.argv[1])
    result = asyncio.run(distribute_sol(amount))
    print(json.dumps(result))