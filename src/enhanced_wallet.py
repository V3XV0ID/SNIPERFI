from solana.keypair import Keypair
import json
import sys
import base58
import os
import time
from dotenv import load_dotenv
from utils.error_handler import ErrorHandler
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

load_dotenv()
error_handler = ErrorHandler()

def derive_key_from_password(password, salt=None):
    """
    Derive an encryption key from a password using PBKDF2
    """
    try:
        if salt is None:
            salt = os.urandom(16)
        elif isinstance(salt, str):
            salt = salt.encode()
            
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key), salt
    except Exception as e:
        error_data = error_handler.handle_error(e, "derive_key_from_password")
        return None, None

def generate_wallet(password=None):
    """
    Generate a new Solana wallet
    If password is provided, use it for encryption instead of env variables
    """
    try:
        # Generate new keypair
        keypair = Keypair()
        secret_key_bytes = bytes(keypair.secret_key)
        private_key_b58 = base58.b58encode(secret_key_bytes).decode('utf-8')
        
        # Use password if provided, otherwise fall back to env variable
        if password:
            fernet, salt = derive_key_from_password(password)
            if not fernet:
                raise Exception("Failed to derive encryption key from password")
                
            # Store the salt with the wallet for later decryption
            salt_b64 = base64.b64encode(salt).decode('utf-8')
        else:
            # Fall back to environment variable method
            fernet = get_encryption_key()
            salt_b64 = None
            if not fernet:
                raise Exception("Failed to initialize encryption")
        
        # Encrypt the private key
        encrypted_private_key = fernet.encrypt(private_key_b58.encode()).decode()
        
        # Prepare wallet info
        wallet_info = {
            'public_key': str(keypair.public_key),
            'private_key': encrypted_private_key,
            'created_at': time.time(),
            'encrypted_with_password': password is not None
        }
        
        # Add salt if password was used
        if salt_b64:
            wallet_info['salt'] = salt_b64
        
        # Ensure wallet directory exists
        wallet_dir = os.path.join(os.path.dirname(__file__), '..', 'wallets')
        os.makedirs(wallet_dir, exist_ok=True)
        
        # Save wallet to file
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

def get_encryption_key():
    """
    Legacy method to get encryption key from environment variables
    """
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

def get_wallet_info(password=None):
    """
    Get wallet information, optionally using a password for decryption
    """
    try:
        wallet_path = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'parent_wallet.json')
        if not os.path.exists(wallet_path):
            return {'public_key': None, 'private_key': None}
            
        with open(wallet_path, 'r') as f:
            wallet_info = json.load(f)
        
        # Check if wallet was encrypted with password
        encrypted_with_password = wallet_info.get('encrypted_with_password', False)
        
        # Decrypt private key
        if wallet_info.get('private_key'):
            try:
                if encrypted_with_password and password:
                    # Use provided password with stored salt
                    if 'salt' not in wallet_info:
                        return {
                            'success': False, 
                            'error': {
                                'message': 'Wallet requires password but no salt found',
                                'type': 'DecryptionError'
                            }
                        }
                    
                    salt = base64.b64decode(wallet_info['salt'])
                    fernet, _ = derive_key_from_password(password, salt)
                else:
                    # Use environment variable method
                    fernet = get_encryption_key()
                
                if not fernet:
                    raise Exception("Failed to initialize decryption")
                    
                encrypted_key = wallet_info['private_key'].encode()
                decrypted_key = fernet.decrypt(encrypted_key).decode()
                wallet_info['private_key'] = decrypted_key
                wallet_info['success'] = True
            except Exception as e:
                error_data = error_handler.handle_error(e, "decrypt_private_key")
                return {
                    'success': False,
                    'error': {
                        'message': 'Failed to decrypt wallet: ' + str(e),
                        'type': 'DecryptionError'
                    },
                    'requires_password': encrypted_with_password
                }
        
        return wallet_info
    except Exception as e:
        error_data = error_handler.handle_error(e, "get_wallet_info")
        return error_handler.format_error_response(error_data)

def backup_wallet(password=None, output_path=None):
    """
    Create a backup of the wallet, optionally re-encrypting with a new password
    """
    try:
        # Get current wallet info
        wallet_info = get_wallet_info(password)
        
        if not wallet_info.get('success', True):
            return wallet_info  # Return error from get_wallet_info
            
        if not wallet_info.get('private_key'):
            return {
                'success': False,
                'error': {
                    'message': 'No wallet found or failed to decrypt',
                    'type': 'BackupError'
                }
            }
        
        # Get the decrypted private key
        private_key = wallet_info['private_key']
        public_key = wallet_info['public_key']
        
        # Re-encrypt with the provided password
        if password:
            fernet, salt = derive_key_from_password(password)
            if not fernet:
                raise Exception("Failed to derive encryption key from password")
                
            salt_b64 = base64.b64encode(salt).decode('utf-8')
            encrypted_private_key = fernet.encrypt(private_key.encode()).decode()
        else:
            # Use default encryption
            fernet = get_encryption_key()
            if not fernet:
                raise Exception("Failed to initialize encryption")
                
            encrypted_private_key = fernet.encrypt(private_key.encode()).decode()
            salt_b64 = None
        
        # Create backup data
        backup_data = {
            'public_key': public_key,
            'private_key': encrypted_private_key,
            'created_at': time.time(),
            'backup_date': time.time(),
            'encrypted_with_password': password is not None
        }
        
        # Add salt if password was used
        if salt_b64:
            backup_data['salt'] = salt_b64
        
        # Determine backup path
        if not output_path:
            backup_dir = os.path.join(os.path.dirname(__file__), '..', 'wallets', 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            output_path = os.path.join(backup_dir, f'wallet_backup_{int(time.time())}.json')
        
        # Save backup
        with open(output_path, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        return {
            'success': True,
            'message': f'Wallet backed up successfully to {output_path}',
            'backup_path': output_path
        }
    except Exception as e:
        error_data = error_handler.handle_error(e, "backup_wallet")
        return error_handler.format_error_response(error_data)

def restore_wallet(backup_path, password=None):
    """
    Restore a wallet from a backup file
    """
    try:
        if not os.path.exists(backup_path):
            return {
                'success': False,
                'error': {
                    'message': f'Backup file not found: {backup_path}',
                    'type': 'RestoreError'
                }
            }
        
        # Load backup data
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        # Check if backup was encrypted with password
        encrypted_with_password = backup_data.get('encrypted_with_password', False)
        
        # Decrypt private key from backup
        if backup_data.get('private_key'):
            try:
                if encrypted_with_password and password:
                    # Use provided password with stored salt
                    if 'salt' not in backup_data:
                        return {
                            'success': False, 
                            'error': {
                                'message': 'Backup requires password but no salt found',
                                'type': 'DecryptionError'
                            }
                        }
                    
                    salt = base64.b64decode(backup_data['salt'])
                    fernet, _ = derive_key_from_password(password, salt)
                else:
                    # Use environment variable method
                    fernet = get_encryption_key()
                
                if not fernet:
                    raise Exception("Failed to initialize decryption")
                    
                encrypted_key = backup_data['private_key'].encode()
                decrypted_key = fernet.decrypt(encrypted_key).decode()
                
                # Re-encrypt for storage
                new_fernet = get_encryption_key()
                if not new_fernet:
                    raise Exception("Failed to initialize encryption for storage")
                    
                new_encrypted_key = new_fernet.encrypt(decrypted_key.encode()).decode()
                
                # Prepare wallet info for storage
                wallet_info = {
                    'public_key': backup_data['public_key'],
                    'private_key': new_encrypted_key,
                    'restored_at': time.time(),
                    'original_backup_date': backup_data.get('backup_date', 0),
                    'encrypted_with_password': False  # Using default encryption for storage
                }
                
                # Save restored wallet
                wallet_dir = os.path.join(os.path.dirname(__file__), '..', 'wallets')
                os.makedirs(wallet_dir, exist_ok=True)
                wallet_path = os.path.join(wallet_dir, 'parent_wallet.json')
                
                with open(wallet_path, 'w') as f:
                    json.dump(wallet_info, f, indent=2)
                
                return {
                    'success': True,
                    'message': 'Wallet restored successfully',
                    'public_key': backup_data['public_key']
                }
                
            except Exception as e:
                error_data = error_handler.handle_error(e, "decrypt_backup")
                return {
                    'success': False,
                    'error': {
                        'message': 'Failed to decrypt backup: ' + str(e),
                        'type': 'DecryptionError'
                    },
                    'requires_password': encrypted_with_password
                }
        else:
            return {
                'success': False,
                'error': {
                    'message': 'Invalid backup file: No private key found',
                    'type': 'RestoreError'
                }
            }
    except Exception as e:
        error_data = error_handler.handle_error(e, "restore_wallet")
        return error_handler.format_error_response(error_data)

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    if command == 'generate':
        # Check if password was provided
        password = sys.argv[2] if len(sys.argv) > 2 else None
        result = generate_wallet(password)
        print(json.dumps(result))
    elif command == 'info':
        # Check if password was provided
        password = sys.argv[2] if len(sys.argv) > 2 else None
        result = get_wallet_info(password)
        print(json.dumps(result))
    elif command == 'backup':
        # Get password and optional output path
        password = sys.argv[2] if len(sys.argv) > 2 else None
        output_path = sys.argv[3] if len(sys.argv) > 3 else None
        result = backup_wallet(password, output_path)
        print(json.dumps(result))
    elif command == 'restore':
        # Get backup path and optional password
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': {
                    'type': 'InvalidArguments',
                    'message': 'Backup path is required',
                    'context': 'main'
                }
            }))
        else:
            backup_path = sys.argv[2]
            password = sys.argv[3] if len(sys.argv) > 3 else None
            result = restore_wallet(backup_path, password)
            print(json.dumps(result))
    else:
        print(json.dumps({
            'success': False,
            'error': {
                'type': 'InvalidCommand',
                'message': 'Invalid command. Use "generate", "info", "backup", or "restore".',
                'context': 'main'
            }
        }))