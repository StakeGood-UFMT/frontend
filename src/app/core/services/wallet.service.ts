import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _address = signal<string | null>(null);
  public address = this._address.asReadonly();

  constructor() {}

  async connect() {
    // Placeholder for wallet connection logic
    this._address.set('0x123...abc');
  }

  async disconnect() {
    this._address.set(null);
  }
}
