import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-card" [class.unread]="!notification.read" [class.read]="notification.read">
      <div class="status-indicator" *ngIf="!notification.read"></div>
      
      <div class="icon-section" [ngClass]="notification.type">
        <i class="icon" [ngSwitch]="notification.type">
          <span *ngSwitchCase="'success'">✅</span>
          <span *ngSwitchCase="'error'">❌</span>
          <span *ngSwitchCase="'warning'">⚠️</span>
          <span *ngSwitchCase="'claim'">💰</span>
          <span *ngSwitchCase="'market'">📊</span>
          <span *ngSwitchDefault>ℹ️</span>
        </i>
      </div>

      <div class="content-section">
        <div class="header">
          <h4 class="title">{{ notification.title }}</h4>
          <span class="timestamp">{{ notification.created_at | date:'short' }}</span>
        </div>
        <p class="message">{{ notification.message }}</p>
        
        <div class="actions" *ngIf="notification.cta_label && notification.cta_link">
          <a [routerLink]="notification.cta_link" class="cta-button" (click)="onCtaClick()">
            {{ notification.cta_label }}
          </a>
        </div>
      </div>

      <div class="menu-section">
        <button *ngIf="!notification.read" class="mark-read-btn" (click)="markAsRead.emit(notification.id)" title="Mark as read">
          <span class="dot"></span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
      position: relative;
      transition: all 0.2s ease;
      margin-bottom: 0.75rem;
    }

    .notification-card.unread {
      border-left: 4px solid #11D48A;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .notification-card.read {
      background: #F9FAFB;
      border-color: #F3F4F6;
      opacity: 0.8;
    }

    .notification-card.read .icon-section {
      filter: grayscale(1);
      opacity: 0.6;
    }

    .status-indicator {
      position: absolute;
      top: 1.25rem;
      left: -2px;
      width: 4px;
      height: 24px;
      background: #11D48A;
      border-radius: 0 4px 4px 0;
    }

    .icon-section {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .icon-section.success { background: #E8FBF4; }
    .icon-section.error { background: #FEF2F2; }
    .icon-section.warning { background: #FFFBEB; }
    .icon-section.info { background: #EFF6FF; }
    .icon-section.claim { background: #F0FDF4; }
    .icon-section.market { background: #F5F3FF; }

    .content-section {
      flex: 1;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #9CA3AF;
      font-weight: 500;
    }

    .message {
      margin: 0;
      font-size: 0.875rem;
      color: #6B7280;
      line-height: 1.4;
    }

    .actions {
      margin-top: 0.75rem;
    }

    .cta-button {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      background: #11D48A;
      color: white;
      text-decoration: none;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .cta-button:hover {
      background: #0EB978;
    }

    .menu-section {
      display: flex;
      align-items: center;
    }

    .mark-read-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .mark-read-btn:hover {
      background: #F3F4F6;
    }

    .mark-read-btn .dot {
      width: 8px;
      height: 8px;
      background: #11D48A;
      border-radius: 50%;
    }
  `]
})
export class NotificationCardComponent {
  @Input({ required: true }) notification!: UserNotification;
  @Output() markAsRead = new EventEmitter<string>();

  onCtaClick() {
    if (!this.notification.read) {
      this.markAsRead.emit(this.notification.id);
    }
  }
}
