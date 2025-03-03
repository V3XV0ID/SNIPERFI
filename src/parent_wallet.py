from solana.keypair import Keypair
import json
import sys
import base58
import os

def generate_wallet():
    try:
        # Generate new keypair
        keypair = Keypair()
        
        # Convert secret key to bytes and then to base58
        secret_key_bytes = bytes(keypair.secret_key)
        private_key_b58 = base58.b58encode(secret_key_bytes).decode('utf-8')
        
        # Save wallet info
        wallet_info = {
            'public_key': str(keypair.public_key),
            'private_key': private_key_b58
        }
        
        # Create directory if it doesn't exist
        os.makedirs('src/wallets', exist_ok=True)
        
        # Save to file
        with open('src/wallets/parent_wallet.json', 'w') as f:
            json.dump(wallet_info, f, indent=2)
        
        print(json.dumps({
            'success': True,
            'public_key': str(keypair.public_key),
            'private_key': private_key_b58
        }))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

def get_wallet_info():
    try:
        with open('src/wallets/parent_wallet.json', 'r') as f:
            return json.dumps(json.load(f))
    except FileNotFoundError:
        return json.dumps({'public_key': None, 'private_key': None})
    except Exception as e:
        return json.dumps({'error': str(e)})

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    if command == 'generate':
        generate_wallet()
    elif command == 'info':
        print(get_wallet_info())
    else:
        print(json.dumps({'error': 'Invalid command'}))