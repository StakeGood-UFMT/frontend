import { Injectable } from '@angular/core';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { WalletConnectModule } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';
import { 
  type Networks,
  KitEventType,
  type KitEventStateUpdated
} from '@creit.tech/stellar-wallets-kit/types';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _publicKey = new BehaviorSubject<string | null>(null);
  public publicKey$ = this._publicKey.asObservable();
  
  private _walletId = new BehaviorSubject<string | null>(null);

  constructor() {
    StellarWalletsKit.init({
      network: environment.stellar.networkPassphrase as Networks,
      modules: [
        new AlbedoModule(),
        new FreighterModule(),
        new xBullModule(),
        new WalletConnectModule({
          projectId: '891007829285038c3539822a96942953',
          metadata: {
            name: 'StakeGood',
            description: 'StakeGood - Web3 Social Impact',
            url: 'https://stakegood.org',
            icons: ['https://stakegood.org/favicon.ico']
          }
        })
      ]
    });

    // Listen for state changes (reconnection/manual changes)
    StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      const address = event.payload.address || null;
      this._publicKey.next(address);
    });

    StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event: any) => {
      const id = event.payload.id || null;
      this._walletId.next(id);
      if (id) {
        sessionStorage.setItem('walletId', id);
      } else {
        sessionStorage.removeItem('walletId');
      }
    });

    // Restore session
    const savedWalletId = sessionStorage.getItem('walletId');
    if (savedWalletId) {
      this.reconnect(savedWalletId);
    }
  }

  get address(): string | null {
    return this._publicKey.getValue();
  }

  async connect() {
    try {
      // Force a clean state before opening the modal to ensure it always shows
      await this.disconnect();
      
      // authModal will trigger WALLET_SELECTED and STATE_UPDATED events
      await StellarWalletsKit.authModal();
    } catch (error) {
      console.error('Connection failed or closed', error);
      await this.disconnect();
    }
  }

  private async reconnect(walletId: string) {
    try {
      StellarWalletsKit.setWallet(walletId);
      const { address } = await StellarWalletsKit.fetchAddress();
      if (address) {
        this._publicKey.next(address);
        this._walletId.next(walletId);
      }
    } catch (error) {
      console.warn('Auto-reconnect failed', error);
      await this.disconnect();
    }
  }

  async disconnect() {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {}
    
    this._publicKey.next(null);
    this._walletId.next(null);
    sessionStorage.removeItem('walletId');
    
    // Clear kit's internal storage to prevent auto-reconnect on next modal open
    localStorage.removeItem('swk_activeAddress');
    localStorage.removeItem('swk_selectedModuleId');
  }

  async sign(xdr: string): Promise<string> {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: environment.stellar.networkPassphrase,
        address: this.address
      });
      return signedTxXdr;
    } catch (error) {
      console.error('Signing failed', error);
      throw error;
    }
  }
}
