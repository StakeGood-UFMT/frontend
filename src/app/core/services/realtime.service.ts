import { Injectable, inject, effect } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { PendingTxStore } from './pending-tx.service';
import { NotificationService } from './notification.service';
import { UserNotificationsService } from './user-notifications.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private authService = inject(AuthService);
  private pendingTxStore = inject(PendingTxStore);
  private notificationService = inject(NotificationService);
  private userNotificationsService = inject(UserNotificationsService);
  
  private socket: WebSocket | null = null;
  private reconnectTimeout: any = null;

  constructor() {
    // Automatically connect/disconnect based on login state
    effect(() => {
      const profile = this.authService.profile();
      if (profile?.public_key) {
        this.connect(profile.public_key);
        this.userNotificationsService.fetchNotifications();
      } else {
        this.disconnect();
      }
    }, { allowSignalWrites: true });
  }

  private connect(wallet: string) {
    if (this.socket) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = environment.apiBaseUrl.replace(/^https?:\/\//, '');
    const url = `${protocol}//${host}/ws?wallet=${wallet}`;

    console.log('[RealtimeService] Connecting to:', url);
    
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[RealtimeService] Connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleEvent(data);
      } catch (e) {
        console.error('[RealtimeService] Failed to parse message:', event.data);
      }
    };

    this.socket.onclose = () => {
      console.log('[RealtimeService] Disconnected');
      this.socket = null;
      this.scheduleReconnect(wallet);
    };

    this.socket.onerror = (error) => {
      console.error('[RealtimeService] Socket error:', error);
    };
  }

  private disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private scheduleReconnect(wallet: string) {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(wallet);
    }, 5000);
  }

  private handleEvent(payload: { event: string; data: any }) {
    const { event, data } = payload;
    console.log(`[RealtimeService] Event received: ${event}`, data);

    switch (event) {
      case 'tx_submitted':
        if (data.txHash) {
          this.pendingTxStore.updateStatus(data.txHash, 'submitted');
        }
        break;

      case 'tx_confirmed':
        if (data.txHash) {
          this.pendingTxStore.updateStatus(data.txHash, 'confirmed');
          this.notificationService.show('Transaction confirmed!', 'success', data.txHash);
          // Optionally remove from pending after some time or immediately
          setTimeout(() => this.pendingTxStore.removeTx(data.txHash), 10000);
        }
        break;

      case 'tx_failed':
        if (data.txHash) {
          this.pendingTxStore.updateStatus(data.txHash, 'failed');
          this.notificationService.show(`Transaction failed: ${data.reason || 'Unknown error'}`, 'error', data.txHash);
        }
        break;

      case 'notification_created':
        if (data.notification) {
          this.userNotificationsService.addNotification(data.notification);
          this.notificationService.show(data.notification.title, 'success');
        }
        break;
    }
  }
}
