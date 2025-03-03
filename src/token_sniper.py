from solana.rpc.api import Client
from solana.keypair import Keypair
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID
import json
import sys
import asyncio
import os
from dotenv import load_dotenv
from utils.error_handler import ErrorHandler
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import base58

load_dotenv()
error_handler = ErrorHandler()

def get_encryption_key():
    try:
        salt = os.getenv('WALLET_SALT', os.urandom(16))
        if isinstance(salt, str):
            salt = salt.encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(os.getenv('ENCRYPTION_KEY', 'default').encode()))
        return Fernet(key)
    except Exception as e:
        error_data = error_handler.handle_error(e, "get_encryption_key")
        return None

async def snipe_token(token_mint, amount):
    try:
        wallet_path = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'wallets.json')
        if not os.path.exists(wallet_path):
            raise FileNotFoundError(f"Wallet file not found at {wallet_path}")
            
        with open(wallet_path, 'r') as f:
            wallets = json.load(f)
        
        rpc_endpoint = os.getenv('SOLANA_RPC_ENDPOINT', 'https://api.mainnet-beta.solana.com')
        client = Client(rpc_endpoint)
        results = []
        
        fernet = get_encryption_key()
        if not fernet:
            raise Exception("Failed to initialize encryption")
        
        for wallet_data in wallets:
            try:
                # Decrypt the private key
                encrypted_key = wallet_data['private_key'].encode()
                private_key_b58 = fernet.decrypt(encrypted_key).decode()
                private_key = base58.b58decode(private_key_b58)
                
                # Create wallet from private key
                wallet = Keypair.from_secret_key(bytes(private_key))
                
                # Create token client
                token = Token(client, token_mint, TOKEN_PROGRAM_ID, wallet)
                
                # Get token balance
                token_account = await token.get_accounts_by_owner(wallet.public_key)
                
                # If token account exists, get balance
                if token_account:
                    balance = await token.get_balance(token_account[0].pubkey)
                    results.append({
                        'wallet': str(wallet.public_key),
                        'balance': balance,
                        'status': 'success'
                    })
                else:
                    # No token account found, attempt to buy token
                    # This is where the actual token sniping logic would go
                    # For now, just report that the wallet doesn't have the token
                    results.append({
                        'wallet': str(wallet.public_key),
                        'balance': 0,
                        'status': 'pending',
                        'message': 'No token account found. Ready to snipe.'
                    })
            except Exception as wallet_error:
                error_data = error_handler.handle_error(wallet_error, f"snipe_token:wallet_{wallet_data['public_key']}")
                results.append({
                    'wallet': wallet_data['public_key'],
                    'status': 'failed',
                    'error': error_data['message']
                })
        
        return {'success': True, 'results': results}
        
    except Exception as e:
        error_data = error_handler.handle_error(e, "snipe_token")
        return error_handler.format_error_response(error_data)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': {
                'type': 'InvalidArguments',
                'message': 'Please provide token_mint and amount',
                'context': 'main'
            }
        }))
        sys.exit(1)
        
    token_mint = sys.argv[1]
    amount = float(sys.argv[2])
    
    try:
        result = asyncio.run(snipe_token(token_mint, amount))
        print(json.dumps(result))
    except Exception as e:
        error_data = error_handler.handle_error(e, "main")
        print(json.dumps(error_handler.format_error_response(error_data)))