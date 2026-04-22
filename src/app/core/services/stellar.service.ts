import { Injectable, signal } from '@angular/core';
import { Horizon } from '@stellar/stellar-sdk';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StellarService {
  private server: Horizon.Server;
  
  /**
   * Signal tracking the connection status to the Stellar Horizon server.
   */
  public connectionStatus = signal<'online' | 'offline' | 'connecting'>('connecting');

  constructor() {
    this.server = new Horizon.Server(environment.stellar.horizonUrl);
    this.validateConnection();
  }

  /**
   * Validates the connection to the Horizon server by fetching the latest network ledger.
   */
  private async validateConnection() {
    try {
      // Small request to check if the server is responsive
      await this.server.ledgers().limit(1).call();
      this.connectionStatus.set('online');
      console.log(`[StellarService] Successfully connected to ${environment.stellar.network}`);
    } catch (error) {
      this.connectionStatus.set('offline');
      console.error(`[StellarService] Failed to connect to ${environment.stellar.network}:`, error);
    }
  }

  /**
   * Returns the Horizon Server instance for making requests.
   */
  public getServer(): Horizon.Server {
    return this.server;
  }

  /**
   * Utility to get the current network name from environment.
   */
  public getNetwork(): string {
    return environment.stellar.network;
  }
}
