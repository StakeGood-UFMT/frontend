import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { UserNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class UserNotificationsService {
  private http = inject(HttpClient);
  
  private _notifications = signal<UserNotification[]>([]);
  private _loading = signal<boolean>(false);

  public notifications = this._notifications.asReadonly();
  public loading = this._loading.asReadonly();

  public unreadCount = computed(() => 
    this._notifications().filter(n => !n.read).length
  );

  async fetchNotifications(): Promise<void> {
    this._loading.set(true);
    try {
      const response = await lastValueFrom(
        this.http.get<UserNotification[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notifications.base}`)
      );
      this._notifications.set(response);
    } catch (err) {
      console.error('[UserNotificationsService] Failed to fetch notifications', err);
    } finally {
      this._loading.set(false);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await lastValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notifications.markAllRead}`, {})
      );
      this._notifications.update(list => 
        list.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('[UserNotificationsService] Failed to mark all as read', err);
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await lastValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notifications.read(id)}`, {})
      );
      this._notifications.update(list => 
        list.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('[UserNotificationsService] Failed to mark as read', id, err);
    }
  }

  addNotification(notification: UserNotification) {
    this._notifications.update(list => [notification, ...list]);
  }
}
