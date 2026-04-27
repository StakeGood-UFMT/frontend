import { Injectable, signal } from '@angular/core';

export type NotificationType = 'pending' | 'success' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  txHash?: string;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  public readonly notifications$ = this.notifications.asReadonly();

  show(message: string, type: NotificationType = 'pending', txHash?: string, persistent = false): string {
    const id = Math.random().toString(36).substring(2, 9);
    this.notifications.update(prev => [...prev, { id, message, type, txHash, persistent }]);
    
    if (!persistent) {
      setTimeout(() => this.remove(id), 5000);
    }
    
    return id;
  }

  remove(id: string) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }

  update(id: string, updates: Partial<Notification>) {
    this.notifications.update(prev => 
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  }

  success(message: string, txHash?: string, persistent = false): string {
    return this.show(message, 'success', txHash, persistent);
  }

  error(message: string, txHash?: string, persistent = false): string {
    return this.show(message, 'error', txHash, persistent);
  }
}
