from solana.rpc.api import Client
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
import json
import sys
import asyncio
import os
import base58
from dotenv import load_dotenv
from utils.error_handler import ErrorHandler
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

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

async def distribute_sol(amount):
    try:
        # Load parent wallet
        parent_wallet_path = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'parent_wallet.json')
        if not os.path.exists(parent_wallet_path):
            raise FileNotFoundError("Parent wallet not found. Please generate a parent wallet first.")
            
        with open(parent_wallet_path, 'r') as f:
            parent_data = json.load(f)
            
        # Load child wallets
        wallet_path = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'wallets.json')
        with open(wallet_path, 'r') as f:
            wallets = json.load(f)
        
        # Use RPC endpoint from environment variable
        rpc_endpoint = os.getenv('SOLANA_RPC_ENDPOINT', 'https://api.mainnet-beta.solana.com')
        client = Client(rpc_endpoint)
        
        # Convert amount to lamports
        lamports = int(amount * 1e9)
        
        # Get encryption key for parent wallet
        fernet = get_encryption_key()
        if not fernet:
            raise Exception("Failed to initialize encryption")
            
        # Decrypt parent wallet private key
        encrypted_key = parent_data['private_key'].encode()
        private_key_b58 = fernet.decrypt(encrypted_key).decode()
        private_key = base58.b58decode(private_key_b58)
        parent_wallet = Keypair.from_secret_key(bytes(private_key))
        
        results = []
        for wallet_data in wallets:
            try:
                # Decrypt child wallet private key
                encrypted_key = wallet_data['private_key'].encode()
                child_private_key_b58 = fernet.decrypt(encrypted_key).decode()
                child_private_key = base58.b58decode(child_private_key_b58)
                child_wallet = Keypair.from_secret_key(bytes(child_private_key))
                
                # Build and send transaction from parent to child wallet
                tx = Transaction()
                tx.add(transfer(TransferParams(
                    from_pubkey=parent_wallet.public_key,
                    to_pubkey=child_wallet.public_key,
                    lamports=lamports
                )))
                
                result = await client.send_transaction(tx, parent_wallet)
                results.append({
                    'wallet': wallet_data['public_key'],
                    'signature': result['result'],
                    'status': 'success'
                })
            except Exception as wallet_error:
                # Handle individual wallet errors
                error_data = error_handler.handle_error(wallet_error, f"distribute_sol:wallet_{wallet_data['public_key']}")
                results.append({
                    'wallet': wallet_data['public_key'],
                    'status': 'failed',
                    'error': error_data['message']
                })
        
        return {'success': True, 'results': results}
        
    except Exception as e:
        error_data = error_handler.handle_error(e, "distribute_sol")
        return error_handler.format_error_response(error_data)

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                'success': False,
                'error': {
                    'type': 'InvalidArgument',
                    'message': 'Amount argument is required',
                    'context': 'main'
                }
            }))
        else:
            amount = float(sys.argv[1])
            result = asyncio.run(distribute_sol(amount))
            print(json.dumps(result))
    except ValueError as e:
        error_data = error_handler.handle_error(e, "main:parse_amount")
        print(json.dumps(error_handler.format_error_response(error_data)))