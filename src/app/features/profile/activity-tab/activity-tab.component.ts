import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService } from './activity.service';
import { ActivityItem } from '../../../core/models/activity.model';

@Component({
  selector: 'app-activity-tab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="activity-tab-wrapper">
      <div class="tab-header">
        <div class="header-info">
          <h2>Activity Log</h2>
          <p class="description">
            Track your KYC progress, fiat gateway registration, and prediction stakes history.
          </p>
        </div>
        <button (click)="loadActivities()" class="refresh-btn" [disabled]="loading()">
          <span [class.spinning]="loading()">↻</span> Refresh
        </button>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <div class="skeleton-timeline">
          <div *ngFor="let i of [1,2,3]" class="skeleton-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line text"></div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading() && activities().length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No activity yet</h3>
        <p>Your KYC verification updates, gateway registration, and stakes will appear here.</p>
        <small>Place a stake in the Arena or check your Profile settings to get started.</small>
      </div>

      <div *ngIf="!loading() && activities().length > 0" class="timeline-container">
        <div class="timeline-line"></div>
        
        <div *ngFor="let item of paginatedActivities()" class="timeline-item" [attr.data-type]="item.type">
          <!-- Timeline Node Icon -->
          <div class="timeline-icon-wrapper" [class]="item.status.toLowerCase()">
            <span class="timeline-icon" [ngSwitch]="item.type">
              <span *ngSwitchCase="'kyc'">👤</span>
              <span *ngSwitchCase="'gateway'">💳</span>
              <span *ngSwitchCase="'stake'">🎯</span>
              <span *ngSwitchDefault>📝</span>
            </span>
          </div>

          <!-- Timeline Content Card -->
          <div class="timeline-content-card">
            <div class="card-body-wrapper">
              <div class="card-main-info">
                <div class="title-row">
                  <span class="item-title">{{ item.title }}</span>
                  <span class="status-badge" [class]="item.status.toLowerCase()">
                    {{ item.status }}
                  </span>
                  <span class="item-date">{{ item.date | date:'short' }}</span>
                </div>
                <p class="item-description">{{ item.description }}</p>
              </div>

              <!-- Metadata / Actions Section side by side -->
              <div *ngIf="item.type === 'stake' && item.metadata" class="card-side-info">
                <div class="meta-col">
                  <div class="meta-item">
                    <span class="meta-label">Amount:</span>
                    <span class="meta-value amount">{{ item.metadata.amount | number:'1.2-4' }}</span>
                  </div>
                  <div class="meta-item" *ngIf="item.metadata.payoutAmount && item.metadata.payoutAmount > 0">
                    <span class="meta-label">Payout:</span>
                    <span class="meta-value payout">+{{ item.metadata.payoutAmount | number:'1.2-4' }}</span>
                  </div>
                </div>

                <div class="links-col">
                  <a *ngIf="item.metadata.marketId" 
                     [routerLink]="['/arena', item.metadata.marketId]" 
                     class="action-link-compact market-link">
                    🏟️ Market
                  </a>
                  <a *ngIf="item.metadata.txHash" 
                     [href]="'https://stellar.expert/explorer/testnet/tx/' + item.metadata.txHash" 
                     target="_blank" 
                     class="action-link-compact tx-link">
                    🔗 Tx
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination" *ngIf="!loading() && activities().length > limit">
        <button [disabled]="page() === 1" (click)="page.set(page() - 1)" class="pagination-btn">
          Previous
        </button>
        <span class="pagination-info">
          Page {{ page() }} of {{ Math.ceil(activities().length / limit) }}
        </span>
        <button [disabled]="page() * limit >= activities().length" (click)="page.set(page() + 1)" class="pagination-btn">
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activity-tab-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeInUp 0.4s ease-out;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      padding-bottom: 12px;
    }

    .header-info h2 {
      margin: 0 0 4px 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #111815;
    }

    .header-info .description {
      color: #6b7280;
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.4;
    }

    .refresh-btn {
      background: transparent;
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #6b7280;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #11D48A;
      color: #11D48A;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      display: inline-block;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Timeline container and lines */
    .timeline-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-left: 12px;
      margin-top: 4px;
    }

    .timeline-line {
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 25px;
      width: 2px;
      background: #e5e7eb;
      z-index: 1;
    }

    .timeline-item {
      display: flex;
      position: relative;
      z-index: 2;
      gap: 12px;
    }

    .timeline-icon-wrapper {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #f3f4f6;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
      transition: transform 0.2s;
    }

    .timeline-item:hover .timeline-icon-wrapper {
      transform: scale(1.1);
    }

    .timeline-icon {
      font-size: 0.85rem;
    }

    /* Colors and states */
    .timeline-icon-wrapper.approved,
    .timeline-icon-wrapper.completed,
    .timeline-icon-wrapper.confirmed,
    .timeline-icon-wrapper.claimed {
      background: #ecfdf5;
      border-color: #34d399;
    }

    .timeline-icon-wrapper.pending {
      background: #fffbeb;
      border-color: #fbbf24;
    }

    .timeline-icon-wrapper.rejected,
    .timeline-icon-wrapper.cancelled {
      background: #fef2f2;
      border-color: #f87171;
    }

    /* Content card design */
    .timeline-content-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 8px 12px;
      flex-grow: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-content-card:hover {
      border-color: rgba(17, 212, 138, 0.2);
      transform: translateX(4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
    }

    .card-body-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .card-main-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-grow: 1;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .item-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #111815;
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f3f4f6;
      color: #6b7280;
    }

    /* Badge specific styles */
    .status-badge.approved,
    .status-badge.completed,
    .status-badge.confirmed,
    .status-badge.claimed {
      background: rgba(16, 185, 129, 0.08);
      color: #10b981;
    }

    .status-badge.pending {
      background: rgba(245, 158, 11, 0.08);
      color: #f59e0b;
    }

    .status-badge.rejected,
    .status-badge.cancelled {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
    }

    .item-description {
      font-size: 0.8rem;
      color: #4b5563;
      margin: 0;
      line-height: 1.35;
      word-break: break-word;
    }

    .item-date {
      font-size: 0.72rem;
      color: #9ca3af;
    }

    /* Stake specific metadata (side column layout) */
    .card-side-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      background: #f9fafb;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.03);
    }

    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      white-space: nowrap;
    }

    .meta-label {
      color: #6b7280;
      font-weight: 500;
    }

    .meta-value {
      font-weight: 700;
    }

    .meta-value.amount {
      color: #3b82f6;
    }

    .meta-value.payout {
      color: #10b981;
    }

    .links-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-left: 1px solid #e5e7eb;
      padding-left: 10px;
    }

    .action-link-compact {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4b5563;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
      white-space: nowrap;
    }

    .action-link-compact:hover {
      color: #11D48A;
    }

    /* Responsive layouts */
    @media (max-width: 768px) {
      .card-body-wrapper {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      .card-side-info {
        justify-content: space-between;
      }
      .links-col {
        border-left: none;
        padding-left: 0;
        flex-direction: row;
        gap: 12px;
      }
    }

    /* States states */
    .loading-state, .empty-state {
      padding: 48px 24px;
      text-align: center;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #6b7280;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 2px;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #111815;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.82rem;
      max-width: 320px;
      line-height: 1.4;
    }

    .empty-state small {
      font-size: 0.72rem;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* Loading skeletons */
    .skeleton-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .skeleton-item {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
    }

    .skeleton-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #f3f4f6;
      flex-shrink: 0;
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-grow: 1;
    }

    .skeleton-line {
      height: 12px;
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 2.5s infinite linear;
    }

    .skeleton-line.title {
      width: 120px;
    }

    .skeleton-line.text {
      width: 80%;
      height: 10px;
    }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Pagination CSS */
    .pagination {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
      padding: 12px 0;
      margin-top: 16px;
    }

    .pagination-btn {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #ffffff;
      color: #4b5563;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #11D48A;
      color: #11D48A;
      background: #f9fafb;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      font-size: 0.78rem;
      color: #6b7280;
      font-weight: 600;
    }
  `]
})
export class ActivityTabComponent implements OnInit {
  private activityService = inject(ActivityService);
  
  activities = signal<ActivityItem[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = 5;

  Math = Math;

  paginatedActivities = computed(() => {
    const start = (this.page() - 1) * this.limit;
    return this.activities().slice(start, start + this.limit);
  });

  ngOnInit() {
    this.loadActivities();
  }

  async loadActivities() {
    this.loading.set(true);
    try {
      const data = await this.activityService.getActivities();
      this.activities.set(data);
      this.page.set(1);
    } catch (error) {
      console.error('Failed to load activities', error);
    } finally {
      this.loading.set(false);
    }
  }
}
