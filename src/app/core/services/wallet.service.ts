import { Injectable, signal } from '@angular/core';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { WalletConnectModule } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private static initialized = false;
  public publicKey = signal<string | null>(null);
  public isConnecting = signal<boolean>(false);

  constructor() {
    if (!WalletService.initialized) {
      StellarWalletsKit.init({
        network: Networks[environment.stellar.network as keyof typeof Networks] || Networks.TESTNET,
        modules: [
          ...defaultModules(),
          new WalletConnectModule({
            projectId: 'dd7ad1f9a9784ee8bc5f6a7a99074cba',
            metadata: {
              name: 'StakeGood',
              description: 'StakeGood - Impact Ledger & Prediction Market',
              url: 'https://stakegood.onrender.com/',
              icons: ['https://stakegood.onrender.com/logo.png'],
            }
          })
        ],
        theme: {
          // StakeGood brand theme
          'background': '#111815',
          'background-secondary': '#0d1f17',
          'foreground-strong': '#ffffff',
          'foreground': '#f1f5f2',
          'foreground-secondary': '#9ca3af',
          'primary': '#11D48A',
          'primary-foreground': '#111815',
          'transparent': 'rgba(0,0,0,0)',
          'lighter': '#1a2e26',
          'light': '#162820',
          'light-gray': 'rgba(255,255,255,0.08)',
          'gray': 'rgba(255,255,255,0.15)',
          'danger': 'oklch(57.7% 0.245 27.325)',
          'border': 'rgba(17,212,138,0.15)',
          'shadow': '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(17,212,138,0.1)',
          'border-radius': '1rem',
          'font-family': "'Inter', 'system-ui', sans-serif",
        }
      });
      WalletService.initialized = true;
    }

    this.hydratePublicKeyFromAuthStorage();
  }

  private hydratePublicKeyFromAuthStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem('stakegood_auth');
      if (!raw) return;
      const parsed = JSON.parse(raw) as any;
      const addr = parsed?.profile?.public_key;
      if (typeof addr === 'string' && addr.length > 0 && !this.publicKey()) {
        this.publicKey.set(addr);
      }
    } catch {
      return;
    }
  }

  ensurePublicKey() {
    if (this.publicKey()) return this.publicKey();
    this.hydratePublicKeyFromAuthStorage();
    return this.publicKey();
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
