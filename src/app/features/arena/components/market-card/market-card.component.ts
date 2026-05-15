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

      <!-- Probability Bar -->
      <div class="probability-section">
        <div class="prob-labels">
          <span class="yes-label">
            <span class="prob-dot yes-dot"></span>
            YES {{ ((market.yes_price || 0) * 100) | number:'1.0-0' }}%
          </span>
          <span class="no-label">
            NO {{ ((market.no_price || 0) * 100) | number:'1.0-0' }}%
            <span class="prob-dot no-dot"></span>
          </span>
        </div>
        <div class="probability-bar">
          <div class="yes-bar" [style.width.%]="(market.yes_price || 0) * 100"></div>
          <div class="no-bar" [style.width.%]="(market.no_price || 0) * 100"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <div class="volume">
          <span class="volume-icon">📊</span>
          <span class="volume-value">{{ (market.total_liquidity || 0) | number:'1.0-2' }} {{ market.asset_code || 'XLM' }}</span>
          <span class="volume-label">Volume</span>
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
      gap: 14px;
      padding: 24px;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .market-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #11D48A, #0EA5E9);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .market-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(17, 212, 138, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
      border-color: rgba(17, 212, 138, 0.2);
    }

    .market-card:hover::before {
      opacity: 1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
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
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-open { color: #11D48A; }
    .status-open .status-dot { background: #11D48A; box-shadow: 0 0 6px rgba(17, 212, 138, 0.5); }

    .status-locked { color: #ef4444; }
    .status-locked .status-dot { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }

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
    }

    .card-description {
      font-size: 0.82rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1; /* Pushes the next elements to the bottom */
    }

    .probability-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }

    .prob-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .yes-label {
      color: #11D48A;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .no-label {
      color: #CC5A37;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .prob-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .yes-dot { background: #11D48A; }
    .no-dot { background: #CC5A37; }

    .probability-bar {
      display: flex;
      height: 8px;
      border-radius: 8px;
      overflow: hidden;
      background: #f3f4f6;
    }

    .yes-bar {
      background: linear-gradient(90deg, #11D48A, #0fd89a);
      border-radius: 8px 0 0 8px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .no-bar {
      background: linear-gradient(90deg, #d96a4c, #CC5A37);
      border-radius: 0 8px 8px 0;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.04);
    }

    .volume {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
    }

    .volume-icon { font-size: 0.85rem; }

    .volume-value {
      font-weight: 700;
      color: #111815;
    }

    .volume-label {
      color: #9ca3af;
      font-weight: 500;
    }

    .lock-date {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .lock-icon { font-size: 0.75rem; }

    .lock-value { font-weight: 500; }

    @media (max-width: 480px) {
      .market-card {
        padding: 18px;
        gap: 10px;
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
