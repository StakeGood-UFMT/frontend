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

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async waitForConfirmation(txHash: string, toastId: string) {
    const maxAttempts = 25;
    const delayMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(delayMs);

      try {
        const statusResp = await firstValueFrom(
          this.http.get<{ status?: string }>(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.status(txHash)}`,
          ),
        );

        const status = (statusResp?.status ?? '').toLowerCase();

        if (status === 'confirmed') {
          this.pendingTxStore.updateStatus(txHash, 'confirmed');
          this.notificationService.update(toastId, {
            message: 'Transaction confirmed!',
            type: 'success',
            persistent: false,
          });
          setTimeout(() => this.notificationService.remove(toastId), 5000);
          setTimeout(() => this.pendingTxStore.removeTx(txHash), 10000);
          return;
        }

        if (status === 'failed') {
          this.pendingTxStore.updateStatus(txHash, 'failed');
          this.notificationService.update(toastId, {
            message: 'Transaction failed. Check Explorer for details.',
            type: 'error',
            persistent: false,
          });
          setTimeout(() => this.notificationService.remove(toastId), 7000);
          return;
        }
      } catch {
      }
    }

    this.notificationService.update(toastId, {
      message:
        'Network congested. Your transaction may still be processing. Check Explorer in a few minutes.',
      persistent: false,
    });
    setTimeout(() => this.notificationService.remove(toastId), 7000);
  }

  async placeStake(marketId: string, outcome: string, amount: number, ngoId: number): Promise<void> {
    const toastId = this.notificationService.show('Building transaction...', 'pending', undefined, true);

    try {
      if (!Number.isInteger(ngoId) || ngoId <= 0) {
        throw new Error('Invalid NGO selection');
      }

      // 1. Build XDR
      const response = await firstValueFrom(
        this.http.post<{ xdr: string; txHash: string }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.buildPrediction}`,
          { 
            market_id: marketId, 
            outcome, 
            amount: amount.toString(),
            ngo_id: ngoId,
          }
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
          {
            signedXdr: signedTxXdr,
            txHash,
            market_id: marketId,
            outcome,
            amount: amount.toString(),
            ngo_id: ngoId,
          }
        )
      );

      this.notificationService.update(toastId, { 
        message: 'Transaction submitted! Waiting for confirmation...',
        txHash
      });

      this.pendingTxStore.updateStatus(txHash, 'submitted');
      void this.waitForConfirmation(txHash, toastId);
    } catch (error: any) {
      console.error('[StakeService] Stake failed:', error);
      
      let errorMessage = 'Failed to place stake';
      
      const backendMsg =
        typeof error?.error?.message === 'string' ? error.error.message : '';
      const backendCode =
        typeof error?.error?.error === 'string' ? error.error.error : '';

      // Handle backend specific errors
      if (error.error?.error === 'KYC_REQUIRED') {
        errorMessage = 'KYC Required: Please verify your identity in settings.';
      } else if (error.error?.error === 'SPENDING_LIMIT_EXCEEDED') {
        errorMessage = `Limit Exceeded: Only $${error.error.remaining} remaining in your limit.`;
      } else if (
        backendMsg &&
        (backendMsg.toLowerCase().includes('locked') ||
          backendMsg.toLowerCase().includes('not active') ||
          backendMsg.toLowerCase().includes('closed'))
      ) {
        errorMessage = 'Market is closed for new stakes.';
      } else if (
        backendMsg &&
        (backendMsg.toLowerCase().includes('resulting balance is not within the allowed range') ||
         backendMsg.toLowerCase().includes('insufficient balance') ||
         backendMsg.toLowerCase().includes('underflow'))
      ) {
        errorMessage = 'Insufficient token balance in your wallet to place this stake. Please deposit funds via On-Ramp.';
      } else if (backendCode === 'HEDGE_LOCK_VIOLATION' || error.status === 409) {
        const existing = error?.error?.existing_outcome;
        if (existing === 'YES' || existing === 'NO') {
          errorMessage = `You already have a position on ${existing}. Hedging is not allowed in this market.`;
        } else {
          errorMessage =
            backendMsg ||
            'Hedging is not allowed. You already have a position on the opposite outcome in this market.';
        }
      } else if (error.error?.code === 'HEDGE_LOCK') {
        errorMessage = 'Hedge Lock: Market is locked for this side of the prediction.';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: Access denied by security policy.';
      } else if (error.message === 'User canceled') {
         errorMessage = 'Transaction canceled by user';
      } else if (backendMsg) {
        if (backendMsg.includes('HostError') || backendMsg.includes('Error(Contract')) {
          errorMessage = 'Smart contract execution failed. Please verify your wallet balance and market status.';
        } else {
          errorMessage = backendMsg;
        }
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
