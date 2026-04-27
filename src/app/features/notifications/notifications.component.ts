import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNotificationsService } from '../../core/services/user-notifications.service';
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NotificationCardComponent],
  template: `
    <div class="notifications-container">
      <div class="page-header">
        <div class="title-group">
          <h1>Notifications</h1>
          <p class="subtitle">Stay updated with your latest activities and market events</p>
        </div>
        
        <button 
          *ngIf="unreadCount() > 0"
          (click)="markAllAsRead()" 
          class="mark-all-btn"
          [disabled]="loading()">
          Mark all as read
        </button>
      </div>

      <div class="notifications-tabs">
        <button 
          [class.active]="activeTab === 'all'" 
          (click)="activeTab = 'all'">
          All <span class="count">{{ notifications().length }}</span>
        </button>
        <button 
          [class.active]="activeTab === 'unread'" 
          (click)="activeTab = 'unread'">
          Unread <span class="count highlight">{{ unreadCount() }}</span>
        </button>
      </div>

      <div class="notifications-list" *ngIf="filteredNotifications().length > 0; else emptyState">
        <app-notification-card 
          *ngFor="let notification of filteredNotifications()" 
          [notification]="notification"
          (markAsRead)="markAsRead($event)">
        </app-notification-card>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>When you have activity, you'll see it here.</p>
        </div>
      </ng-template>

      <div class="loading-overlay" *ngIf="loading() && notifications().length === 0">
        <div class="spinner"></div>
        <p>Loading notifications...</p>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
    }

    .title-group h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.025em;
    }

    .subtitle {
      color: #6B7280;
      margin: 0;
      font-size: 0.95rem;
    }

    .mark-all-btn {
      background: white;
      border: 1px solid #E5E7EB;
      color: #374151;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mark-all-btn:hover:not(:disabled) {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .mark-all-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .notifications-tabs {
      display: flex;
      gap: 1.5rem;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 1.5rem;
    }

    .notifications-tabs button {
      background: none;
      border: none;
      padding: 0.75rem 0.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #6B7280;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .notifications-tabs button.active {
      color: #11D48A;
    }

    .notifications-tabs button.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #11D48A;
    }

    .count {
      background: #F3F4F6;
      color: #6B7280;
      font-size: 0.75rem;
      padding: 0.1rem 0.5rem;
      border-radius: 99px;
    }

    .count.highlight {
      background: #11D48A;
      color: white;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      background: white;
      border-radius: 16px;
      border: 1px dashed #D1D5DB;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #111827;
    }

    .empty-state p {
      margin: 0;
      color: #6B7280;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #F3F4F6;
      border-top-color: #11D48A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class NotificationsPage implements OnInit {
  private userNotificationsService = inject(UserNotificationsService);

  public notifications = this.userNotificationsService.notifications;
  public unreadCount = this.userNotificationsService.unreadCount;
  public loading = this.userNotificationsService.loading;

  public activeTab: 'all' | 'unread' = 'all';

  ngOnInit() {
    this.userNotificationsService.fetchNotifications();
  }

  filteredNotifications() {
    const list = this.notifications();
    if (this.activeTab === 'unread') {
      return list.filter(n => !n.read);
    }
    return list;
  }

  markAsRead(id: string) {
    this.userNotificationsService.markAsRead(id);
  }

  markAllAsRead() {
    this.userNotificationsService.markAllAsRead();
  }
}
