import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metrics-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="metrics-bar" id="metrics">
      <div class="metrics-inner">
        <div class="metric-item">
          <span class="icon">📈</span>
          <span class="label">TOTAL FUNDS RAISED:</span>
          <span class="value">R$ 2,875,140+</span>
        </div>
        <div class="divider">|</div>
        <div class="metric-item">
          <span class="label">LAST DONATION:</span>
          <span class="valueHighlight">R$ 5,500</span>
          <span class="label">to</span>
          <span class="value">Child Education Fund</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .metrics-bar {
      background: #f1f8f7;
      padding: 16px 32px;
      font-family: 'Inter', sans-serif;
      border-top: 1px solid rgba(0,0,0,0.05);
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .metrics-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 20px;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: #374151;
      font-weight: 600;
    }

    .icon {
      font-size: 1.2rem;
    }

    .label {
      color: #6b7280;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.02em;
    }

    .value {
      color: #0d1b15;
      font-weight: 800;
    }

    .valueHighlight {
      color: #0d1b15;
      font-weight: 800;
    }

    .divider {
      color: #d1d5db;
      font-weight: 300;
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .metrics-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .divider {
        display: none;
      }
    }
  `]
})
export class MetricsBarComponent { }
