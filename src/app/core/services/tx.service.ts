import { Injectable, inject } from '@angular/core';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class TxService {
  private walletService = inject(WalletService);

  constructor() {}

  async sendTransaction(txData: any) {
    console.log('Preparing transaction:', txData);
    
    // In a real scenario, txData would be converted to XDR
    const xdr = 'AAAA...'; // Dummy XDR for demonstration
    
    try {
      const signedXdr = await this.walletService.sign(xdr);
      console.log('Transaction signed:', signedXdr);
      
      // Here you would submit the signedXdr to Horizon/Soroban
      return { hash: '0xhash', signedXdr };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}
