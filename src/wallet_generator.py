from solana.keypair import Keypair
from hdwallet import BIP44HDWallet
from hdwallet.cryptocurrencies import SolanaCoin
from hdwallet.derivations import BIP44Derivation
from typing import List
import json

class WalletManager:
    def __init__(self, mnemonic: str = None):
        self.mnemonic = mnemonic if mnemonic else self._generate_mnemonic()
        self.wallets: List[Keypair] = []
        self._generate_hd_wallets()

    def _generate_mnemonic(self) -> str:
        hdwallet = BIP44HDWallet(cryptocurrency=SolanaCoin)
        hdwallet.from_new_mnemonic()
        return hdwallet.mnemonic()

    def _generate_hd_wallets(self):
        hdwallet = BIP44HDWallet(cryptocurrency=SolanaCoin)
        hdwallet.from_mnemonic(self.mnemonic)

        for index in range(100):
            bip44_derivation = BIP44Derivation(
                cryptocurrency=SolanaCoin,
                account=0,
                change=False,
                address=index
            )
            hdwallet.from_path(bip44_derivation)
            private_key = hdwallet.private_key()
            keypair = Keypair.from_seed(bytes.fromhex(private_key))
            self.wallets.append(keypair)
            hdwallet.clean_derivation()

    def save_wallets(self, filename: str = "wallets.json"):
        wallet_data = {
            "mnemonic": self.mnemonic,
            "addresses": [str(w.public_key) for w in self.wallets]
        }
        with open(filename, 'w') as f:
            json.dump(wallet_data, f, indent=4)