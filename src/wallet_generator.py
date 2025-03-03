from solana.keypair import Keypair
import json
import sys

def generate_wallets(count):
    wallets = []
    for _ in range(count):
        wallet = Keypair()
        wallets.append({
            'public_key': str(wallet.public_key),
            'private_key': list(wallet.secret_key)
        })
    
    with open('wallets.json', 'w') as f:
        json.dump(wallets, f, indent=4)
    
    return {'success': True, 'count': count}

if __name__ == "__main__":
    count = int(sys.argv[1])
    result = generate_wallets(count)
    print(json.dumps(result))