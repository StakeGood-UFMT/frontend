import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from './shared/components/notification-container/notification-container.component';
import { WrongNetworkModalComponent } from './shared/components/wrong-network-modal/wrong-network-modal.component';
import { RealtimeService } from './core/services/realtime.service';
import { PendingTxStore } from './core/services/pending-tx.service';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from './core/config/api.config';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationContainerComponent, WrongNetworkModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private realtimeService = inject(RealtimeService); // Initialize WS
  private pendingTxStore = inject(PendingTxStore);
  private http = inject(HttpClient);

  ngOnInit() {
    this.reconcilePendingTransactions();
  }

  private async reconcilePendingTransactions() {
    const pending = this.pendingTxStore.pendingTxs$();
    if (pending.length === 0) return;

    console.log('[App] Reconciling pending transactions...', pending.length);

    // We can either poll the status for each pending tx or wait for WS
    // The requirement says: "verificar localStorage e consultar backend para limpar pendentes"
    for (const tx of pending) {
      if (!tx.txHash) continue;
      
      try {
        const response = await firstValueFrom(
          this.http.get<{ status: string }>(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.status(tx.txHash)}`
          )
        );

        if (response.status === 'confirmed' || response.status === 'failed') {
          console.log(`[App] Clearing reconciled tx: ${tx.txHash} (${response.status})`);
          this.pendingTxStore.removeTx(tx.txHash);
        }
      } catch (error) {
        console.error(`[App] Failed to reconcile tx ${tx.txHash}`, error);
        // If 404, maybe it was never submitted or purged
      }
    }
  }
}
