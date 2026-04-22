import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend?: string;
}

@Component({
  selector: 'app-metrics-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="metrics-bar" id="metrics">
      <div class="metrics-inner">
        <div *ngFor="let m of metrics; let i = index" class="metric-card" [style.animation-delay]="(i * 0.08) + 's'">
          <div class="metric-icon">{{ m.icon }}</div>
          <div class="metric-data">
            <span class="metric-value">{{ m.value }}</span>
            <span class="metric-label">{{ m.label }}</span>
          </div>
          <span *ngIf="m.trend" class="metric-trend">{{ m.trend }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    .metrics-bar {
      background: linear-gradient(135deg, #111815 0%, #1a2e26 100%);
      padding: 40px 80px;
      font-family: 'Inter', sans-serif;
    }

    .metrics-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 24px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      border: 1px solid rgba(17, 212, 138, 0.12);
      transition: all 0.3s ease;
      animation: fadeSlideUp 0.5s ease both;
    }
    .metric-card:hover {
      background: rgba(17, 212, 138, 0.08);
      border-color: rgba(17, 212, 138, 0.3);
      transform: translateY(-3px);
    }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .metric-icon {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .metric-data {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #11D48A;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .metric-label {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .metric-trend {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 700;
      color: #11D48A;
      background: rgba(17, 212, 138, 0.15);
      padding: 3px 8px;
      border-radius: 999px;
    }

    @media (max-width: 960px) {
      .metrics-bar { padding: 32px 40px; }
    }

    @media (max-width: 600px) {
      .metrics-bar { padding: 28px 20px; }
      .metrics-inner { grid-template-columns: 1fr 1fr; gap: 12px; }
      .metric-card { padding: 14px 16px; gap: 10px; }
      .metric-value { font-size: 1.15rem; }
    }
  `]
})
export class MetricsBarComponent {
  metrics: Metric[] = [
    { icon: '🏆', value: '$248k', label: 'Distributed', trend: '+12%' },
    { icon: '🧑‍🤝‍🧑', value: '1,340', label: 'Stakers', trend: '+8%' },
    { icon: '🎯', value: '47', label: 'Active Arenas' },
    { icon: '🤝', value: '12', label: 'Partner NGOs', trend: '+3' },
    { icon: '⭐', value: '98.6%', label: 'Satisfaction' },
  ];
}
