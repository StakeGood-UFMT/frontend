import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { WalletService } from './wallet.service';
import { PendingTxStore } from './pending-tx.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class StakeService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
  private pendingTxStore = inject(PendingTxStore);
  private notificationService = inject(NotificationService);

  async placeStake(marketId: string, outcome: string, amount: number): Promise<void> {
    const toastId = this.notificationService.show('Building transaction...', 'pending', undefined, true);

    try {
      // 1. Build XDR
      const response = await firstValueFrom(
        this.http.post<{ xdr: string; txHash: string }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.buildPrediction}`,
          { marketId, outcome, amount }
        )
      );

      const { xdr, txHash } = response;

      // 2. Persist locally as pending (before signing as requested)
      this.pendingTxStore.addPending({
        txHash,
        marketId,
        outcome,
        amount,
        type: 'STAKE'
      });

      this.notificationService.update(toastId, { message: 'Awaiting signature in wallet...' });

      // 3. Sign XDR
      const { signedTxXdr } = await this.walletService.signTransaction(xdr);

      this.notificationService.update(toastId, { message: 'Submitting transaction...' });

      // 4. Submit Transaction (Assuming a submit endpoint exists)
      // Note: If the backend handles submission automatically after some other trigger, 
      // this part might change. But typically you POST the signed XDR.
      await firstValueFrom(
        this.http.post(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.base}/submit`,
          { signedXdr: signedTxXdr }
        )
      );

      this.notificationService.update(toastId, { 
        message: 'Transaction submitted! Waiting for confirmation...',
        txHash
      });

      // Status will be updated via WebSocket in the store/service
    } catch (error: any) {
      console.error('[StakeService] Stake failed:', error);
      
      let errorMessage = 'Failed to place stake';
      if (error.error?.code === 'HEDGE_LOCK') {
        errorMessage = 'HEDGE_LOCK: Market is currently locked for this operation.';
      } else if (error.message === 'User canceled') {
         errorMessage = 'Transaction canceled by user';
      }

      this.notificationService.update(toastId, { 
        message: errorMessage, 
        type: 'error',
        persistent: false 
      });
      
      throw error;
    }
  }
}
