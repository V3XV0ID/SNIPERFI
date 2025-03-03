from solana.keypair import Keypair
import json
import sys
import os
import base58
from utils.error_handler import ErrorHandler
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from dotenv import load_dotenv

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

def generate_wallets(count):
    try:
        wallets = []
        wallet_dir = os.path.join(os.path.dirname(__file__), '..', 'wallets')
        os.makedirs(wallet_dir, exist_ok=True)
        
        fernet = get_encryption_key()
        if not fernet:
            raise Exception("Failed to initialize encryption")
        
        for _ in range(count):
            wallet = Keypair()
            secret_key_bytes = bytes(wallet.secret_key)
            private_key_b58 = base58.b58encode(secret_key_bytes).decode('utf-8')
            encrypted_private_key = fernet.encrypt(private_key_b58.encode()).decode()
            
            wallets.append({
                'public_key': str(wallet.public_key),
                'private_key': encrypted_private_key
            })
        
        wallet_path = os.path.join(wallet_dir, 'wallets.json')
        with open(wallet_path, 'w') as f:
            json.dump(wallets, f, indent=4)
        
        return {'success': True, 'count': count}
    except Exception as e:
        error_data = error_handler.handle_error(e, "generate_wallets")
        return error_handler.format_error_response(error_data)

if __name__ == "__main__":
    try:
        count = int(sys.argv[1])
        result = generate_wallets(count)
        print(json.dumps(result))
    except (IndexError, ValueError) as e:
        error_data = error_handler.handle_error(e, "main")
        print(json.dumps(error_handler.format_error_response(error_data)))