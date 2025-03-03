from solana.keypair import Keypair
import json
import sys
import base58
import os
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

def generate_wallet():
    try:
        keypair = Keypair()
        secret_key_bytes = bytes(keypair.secret_key)
        private_key_b58 = base58.b58encode(secret_key_bytes).decode('utf-8')
        
        # Encrypt private key
        fernet = get_encryption_key()
        if not fernet:
            raise Exception("Failed to initialize encryption")
        
        encrypted_private_key = fernet.encrypt(private_key_b58.encode()).decode()
        
        wallet_info = {
            'public_key': str(keypair.public_key),
            'private_key': encrypted_private_key
        }
        
        wallet_dir = os.path.join(os.path.dirname(__file__), '..', 'wallets')
        os.makedirs(wallet_dir, exist_ok=True)
        
        wallet_path = os.path.join(wallet_dir, 'parent_wallet.json')
        with open(wallet_path, 'w') as f:
            json.dump(wallet_info, f, indent=2)
        
        return {
            'success': True,
            'public_key': str(keypair.public_key),
            'private_key': private_key_b58  # Return unencrypted for immediate use
        }
    except Exception as e:
        error_data = error_handler.handle_error(e, "generate_wallet")
        return error_handler.format_error_response(error_data)

def get_wallet_info():
    try:
        wallet_path = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'parent_wallet.json')
        if not os.path.exists(wallet_path):
            return {'public_key': None, 'private_key': None}
            
        with open(wallet_path, 'r') as f:
            wallet_info = json.load(f)
            
        # Decrypt private key if needed
        if wallet_info.get('private_key'):
            fernet = get_encryption_key()
            if fernet:
                try:
                    encrypted_key = wallet_info['private_key'].encode()
                    decrypted_key = fernet.decrypt(encrypted_key).decode()
                    wallet_info['private_key'] = decrypted_key
                except Exception as e:
                    error_handler.handle_error(e, "decrypt_private_key")
                    wallet_info['private_key'] = None
            
        return wallet_info
    except Exception as e:
        error_data = error_handler.handle_error(e, "get_wallet_info")
        return error_handler.format_error_response(error_data)

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    if command == 'generate':
        result = generate_wallet()
        print(json.dumps(result))
    elif command == 'info':
        result = get_wallet_info()
        print(json.dumps(result))
    else:
        print(json.dumps({
            'success': False,
            'error': {
                'type': 'InvalidCommand',
                'message': 'Invalid command. Use "generate" or "info".',
                'context': 'main'
            }
        }))