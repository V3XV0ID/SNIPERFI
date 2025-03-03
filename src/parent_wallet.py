from solana.keypair import Keypair
import json
import sys
import base58

def generate_wallet():
    try:
        # Generate new keypair
        keypair = Keypair()
        
        # Save wallet info to file
        wallet_info = {
            'public_key': str(keypair.public_key),
            'private_key': list(keypair.secret_key),
            'base58_private_key': base58.b58encode(keypair.secret_key).decode('ascii')
        }
        
        with open('parent_wallet.json', 'w') as f:
            json.dump(wallet_info, f)
            
        return json.dumps({'success': True, 'public_key': str(keypair.public_key)})
    except Exception as e:
        return json.dumps({'success': False, 'error': str(e)})

def get_wallet_info():
    try:
        with open('parent_wallet.json', 'r') as f:
            wallet_info = json.load(f)
        return json.dumps(wallet_info)
    except FileNotFoundError:
        return json.dumps({'public_key': None, 'base58_private_key': None})
    except Exception as e:
        return json.dumps({'error': str(e)})

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    if command == 'generate':
        print(generate_wallet())
    elif command == 'info':
        print(get_wallet_info())
    else:
        print(json.dumps({'error': 'Invalid command'}))