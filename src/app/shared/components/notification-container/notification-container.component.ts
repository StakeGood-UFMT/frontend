import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TxToastComponent } from '../tx-toast/tx-toast.component';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { PendingTxStore } from '../../../core/services/pending-tx.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, TxToastComponent],
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications$(); track notification.id) {
        <app-tx-toast 
          [notification]="notification" 
          (close)="notificationService.remove(notification.id)"
          (check)="checkStatus(notification.id, $event)"
        />
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  `]
})
export class NotificationContainerComponent {
  public notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private pendingTxStore = inject(PendingTxStore);

  async checkStatus(notificationId: string, txHash: string) {
    try {
      const resp = await firstValueFrom(
        this.http.get<{ status: string }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.status(txHash)}`,
        ),
      );

      const status = (resp?.status ?? '').toLowerCase();

      if (status === 'confirmed') {
        this.pendingTxStore.updateStatus(txHash, 'confirmed');
        this.notificationService.update(notificationId, {
          message: 'Transaction confirmed!',
          type: 'success',
          persistent: false,
        });
        setTimeout(() => this.notificationService.remove(notificationId), 5000);
        setTimeout(() => this.pendingTxStore.removeTx(txHash), 10000);
        return;
      }

      if (status === 'failed') {
        this.pendingTxStore.updateStatus(txHash, 'failed');
        this.notificationService.update(notificationId, {
          message: 'Transaction failed. Check Explorer for details.',
          type: 'error',
          persistent: false,
        });
        setTimeout(() => this.notificationService.remove(notificationId), 7000);
        return;
      }

      this.notificationService.update(notificationId, {
        message: 'Still pending on-chain. Check again in a few seconds.',
      });
    } catch {
      this.notificationService.update(notificationId, {
        message: 'Unable to check status right now. Try again in a moment.',
      });
    }
  }
}
