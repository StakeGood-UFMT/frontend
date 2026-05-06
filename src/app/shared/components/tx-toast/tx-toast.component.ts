import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-tx-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tx-toast" [class]="notification.type">
      <div class="toast-content">
        <div class="status-icon" *ngIf="notification.type === 'pending'">
          <div class="spinner"></div>
        </div>
        <div class="status-icon" *ngIf="notification.type === 'success'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="status-icon" *ngIf="notification.type === 'error'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <div class="message-container">
          <p class="message">{{ notification.message }}</p>
          <a *ngIf="notification.txHash" 
             [href]="'https://stellar.expert/explorer/testnet/tx/' + notification.txHash" 
             target="_blank" 
             class="explorer-link">
            View on Explorer
          </a>
          <button
            *ngIf="notification.type === 'pending' && notification.txHash"
            class="status-btn"
            (click)="check.emit(notification.txHash!)">
            Check status
          </button>
        </div>

        <button class="close-btn" (click)="close.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="progress-bar" *ngIf="!notification.persistent"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 0.75rem;
      pointer-events: auto;
    }

    .tx-toast {
      background: rgba(17, 24, 21, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 1rem;
      width: 320px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Spinner */
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .message-container {
      flex-grow: 1;
    }

    .message {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #fff;
    }

    .explorer-link {
      display: inline-block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--primary, #11D48A);
      text-decoration: none;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .explorer-link:hover {
      opacity: 1;
      text-decoration: underline;
    }

    .status-btn {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.35rem 0.6rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .status-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.22);
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #fff;
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Colors */
    .tx-toast.success {
      border-left: 4px solid #11D48A;
    }
    .tx-toast.success .status-icon {
      color: #11D48A;
    }

    .tx-toast.error {
      border-left: 4px solid #cc4433; /* Terracotta */
    }
    .tx-toast.error .status-icon {
      color: #cc4433;
    }

    .tx-toast.pending {
      border-left: 4px solid rgba(255, 255, 255, 0.3);
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      width: 100%;
      animation: progress 5s linear forwards;
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class TxToastComponent {
  @Input({ required: true }) notification!: Notification;
  @Output() close = new EventEmitter<void>();
  @Output() check = new EventEmitter<string>();
}
