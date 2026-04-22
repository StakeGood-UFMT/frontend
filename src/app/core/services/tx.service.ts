import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TxService {
  constructor() {}

  async sendTransaction(txData: any) {
    // Placeholder for sending transactions
    console.log('Sending transaction:', txData);
    return { hash: '0xhash' };
  }
}
