import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { WalletService } from '../../../core/services/wallet.service';
import { PendingTxStore } from '../../../core/services/pending-tx.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Claim } from '../../../core/models/claim.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
  private pendingTxStore = inject(PendingTxStore);
  private notificationService = inject(NotificationService);

  async getClaims(): Promise<Claim[]> {
    return firstValueFrom(
      this.http.get<Claim[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.meClaims}`)
    );
  }

  async executeClaim(claim: Claim): Promise<void> {
    const toastId = this.notificationService.show('Preparing claim...', 'pending', undefined, true);

    try {
      // 1. Build Claim XDR
      const response = await firstValueFrom(
        this.http.post<{ xdr: string; txHash: string }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.buildClaim}`,
          { claim_id: claim.id }
        )
      );

      const { xdr, txHash } = response;

      // 2. Persist locally as pending
      this.pendingTxStore.addPending({
        txHash,
        marketId: claim.market_id,
        type: 'CLAIM'
      });

      this.notificationService.update(toastId, { message: 'Awaiting signature...' });

      // 3. Sign XDR
      const { signedTxXdr } = await this.walletService.signTransaction(xdr);

      this.notificationService.update(toastId, { message: 'Submitting claim...' });

      // 4. Submit Transaction
      await firstValueFrom(
        this.http.post(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.base}/submit`,
          { signedXdr: signedTxXdr }
        )
      );

      this.notificationService.update(toastId, { 
        message: 'Claim submitted! Waiting for confirmation...',
        txHash
      });

    } catch (error: any) {
      console.error('[ClaimService] Claim failed:', error);
      
      let errorMessage = 'Failed to process claim';
      if (error.message === 'User canceled') {
         errorMessage = 'Claim canceled by user';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
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
