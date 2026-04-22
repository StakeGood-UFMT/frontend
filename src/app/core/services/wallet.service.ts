import { Injectable, signal } from '@angular/core';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  public publicKey = signal<string | null>(null);
  public isConnecting = signal<boolean>(false);

  constructor() {
    StellarWalletsKit.init({
      network: Networks[environment.stellar.network as keyof typeof Networks] || Networks.TESTNET,
      modules: defaultModules()
    });
  }

  async connect(): Promise<string> {
    this.isConnecting.set(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      
      this.publicKey.set(address);
      return address;
    } catch (error) {
      console.error('[WalletService] Connection error:', error);
      throw error;
    } finally {
      this.isConnecting.set(false);
    }
  }

  async sign(message: string): Promise<string> {
    if (!this.publicKey()) {
      throw new Error('No wallet connected');
    }
    
    try {
      const { signedMessage } = await StellarWalletsKit.signMessage(message, {
        address: this.publicKey()!,
        networkPassphrase: Networks[environment.stellar.network as keyof typeof Networks] || Networks.TESTNET
      });
      return signedMessage;
    } catch (error) {
       console.error('[WalletService] Signing error:', error);
       throw error;
    }
  }

  async signTransaction(xdr: string): Promise<{ signedTxXdr: string }> {
     return await StellarWalletsKit.signTransaction(xdr, {
        address: this.publicKey()!,
        networkPassphrase: Networks[environment.stellar.network as keyof typeof Networks] || Networks.TESTNET
     });
  }

  disconnect() {
    this.publicKey.set(null);
    StellarWalletsKit.disconnect();
  }
}
