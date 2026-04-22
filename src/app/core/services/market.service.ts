import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private _markets = signal<any[]>([]);
  public markets = this._markets.asReadonly();

  constructor() {}

  async fetchMarkets() {
    // Placeholder for fetching markets
    this._markets.set([]);
  }
}
