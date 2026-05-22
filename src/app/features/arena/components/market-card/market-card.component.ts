import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Market, derivedStatus, MarketStatus } from '../../../../core/models/market.model';

@Component({
  selector: 'app-market-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="market-card" [routerLink]="['/arena', market.id]" id="market-card-{{market.id}}">
      <!-- Category Badge + Status -->
      <div class="card-header">
        <span class="category-badge" [attr.data-category]="market.category">
          {{ categoryIcon }} {{ market.category }}
        </span>
        <span class="status-badge" [class]="'status-' + displayStatus.toLowerCase()">
          <span class="status-dot"></span>
          {{ displayStatus }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="card-title">{{ market.title }}</h3>

      <!-- Description -->
      <p class="card-description">{{ market.description }}</p>

      <!-- Polymarket Action Buttons -->
      <div class="card-actions">
        <div class="outcome-btn yes-btn">
          <span class="outcome-label">YES</span>
          <span class="outcome-value">{{ ((market.yes_price || 0) * 100) | number:'1.0-0' }}%</span>
        </div>
        <div class="outcome-btn no-btn">
          <span class="outcome-label">NO</span>
          <span class="outcome-value">{{ ((market.no_price || 0) * 100) | number:'1.0-0' }}%</span>
        </div>
      </div>

      <!-- Footer Metrics -->
      <div class="card-footer">
        <div class="footer-metrics">
          <div class="metric">
            <span class="metric-icon">📊</span>
            <span class="metric-value">{{ (market.total_liquidity || 0) | number:'1.0-2' }} {{ market.asset_code || 'XLM' }}</span>
          </div>
          <div class="metric" *ngIf="market.stakers_count !== undefined">
            <span class="metric-icon">👥</span>
            <span class="metric-value">{{ market.stakers_count }} stakers</span>
          </div>
        </div>
        <div class="lock-date">
          <span class="lock-icon">🔒</span>
          <span class="lock-value">{{ lockDateFormatted }}</span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .market-card {
      display: flex;
      flex-direction: column;
      flex: 1; /* Fill available height in grid item */
      height: 100%;
      gap: 16px;
      padding: 20px;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .market-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(17, 212, 138, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03);
      border-color: rgba(17, 212, 138, 0.2);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(17, 212, 138, 0.08);
      color: #0d9b66;
    }

    .category-badge[data-category="Tech"] {
      background: rgba(139, 92, 246, 0.08);
      color: #7c3aed;
    }
    .category-badge[data-category="Sports"] {
      background: rgba(14, 165, 233, 0.08);
      color: #0284c7;
    }
    .category-badge[data-category="Politics"] {
      background: rgba(239, 68, 68, 0.08);
      color: #dc2626;
    }
    .category-badge[data-category="Science"], .category-badge[data-category="Environment"] {
      background: rgba(16, 185, 129, 0.08);
      color: #059669;
    }
    .category-badge[data-category="Entertainment"] {
      background: rgba(245, 158, 11, 0.08);
      color: #d97706;
    }
    .category-badge[data-category="Finance"] {
      background: rgba(99, 102, 241, 0.08);
      color: #4f46e5;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-active { color: #11D48A; }
    .status-active .status-dot { background: #11D48A; box-shadow: 0 0 6px rgba(17, 212, 138, 0.5); }

    .status-locked { color: #ef4444; }
    .status-locked .status-dot { background: #ef4444; }

    .status-resolved { color: #6b7280; }
    .status-resolved .status-dot { background: #6b7280; }

    .status-cancelled { color: #9ca3af; }
    .status-cancelled .status-dot { background: #9ca3af; }

    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.4;
      color: #111815;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 2.8em; /* standard two line height */
    }

    .card-description {
      font-size: 0.82rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    /* ---- YES / NO Action Buttons ---- */
    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 4px;
    }

    .outcome-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .yes-btn {
      background: rgba(17, 212, 138, 0.08);
      color: #0d9b66;
    }

    .yes-btn:hover {
      background: rgba(17, 212, 138, 0.16);
      transform: scale(1.02);
      border-color: rgba(17, 212, 138, 0.3);
    }

    .no-btn {
      background: rgba(204, 90, 55, 0.08);
      color: #CC5A37;
    }

    .no-btn:hover {
      background: rgba(204, 90, 55, 0.16);
      transform: scale(1.02);
      border-color: rgba(204, 90, 55, 0.3);
    }

    .outcome-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    .outcome-value {
      font-size: 0.9rem;
      font-weight: 800;
    }

    /* ---- Card Footer ---- */
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.04);
      font-size: 0.78rem;
      color: #9ca3af;
    }

    .footer-metrics {
      display: flex;
      gap: 12px;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .metric-value {
      font-weight: 600;
      color: #4b5563;
    }

    .lock-date {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .lock-value {
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .market-card {
        padding: 16px;
        gap: 12px;
      }
      .card-title {
        font-size: 0.95rem;
      }
    }
  `]
})
export class MarketCardComponent {
  @Input({ required: true }) market!: Market;

  get displayStatus(): MarketStatus {
    return derivedStatus(this.market);
  }

  get categoryIcon(): string {
    const icons: Record<string, string> = {
      Finance: '💰',
      Tech: '💻',
      Sports: '⚽',
      Environment: '🌱',
      Politics: '🏛',
      Science: '🔬',
      Health: '🏥',
      Education: '🎓',
      Animals: '🐾',
      Entertainment: '🎬',
      ALL: '🌐'
    };
    return icons[this.market.category] || '📌';
  }

  get lockDateFormatted(): string {
    if (!this.market.lock_at) return 'N/A';
    const d = new Date(this.market.lock_at);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
