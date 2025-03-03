from solana.rpc.api import Client
from solana.keypair import Keypair
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID
import json
import sys
import asyncio

async def snipe_token(token_mint, amount):
    try:
        with open('wallets.json', 'r') as f:
            wallets = json.load(f)
        
        client = Client("https://api.mainnet-beta.solana.com")
        results = []
        
        for wallet_data in wallets:
            wallet = Keypair.from_secret_key(bytes(wallet_data['private_key']))
            token = Token(client, token_mint, TOKEN_PROGRAM_ID, wallet)
            
            result = await token.get_balance(wallet.public_key)
            results.append({
                'wallet': str(wallet.public_key),
                'balance': result
            })
        
        return {'success': True, 'results': results}
        
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    token_mint, amount = sys.argv[1], float(sys.argv[2])
    result = asyncio.run(snipe_token(token_mint, amount))
    print(json.dumps(result))