import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-market-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="market-detail-stub">
      <div class="card">
        <a routerLink="/arena" class="back-link">← Back to Arena</a>
        <h1>Market Detail</h1>
        <p>Market ID: <strong>{{ marketId }}</strong></p>
        <div class="placeholder-content">
          <p>Detail view, charts, and staking form will be implemented in FE-6.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .market-detail-stub {
      max-width: 800px;
      margin: 2rem auto;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
    }
    .placeholder-content {
      margin-top: 2rem;
      padding: 2rem;
      border: 2px dashed rgba(0,0,0,0.1);
      border-radius: 12px;
      text-align: center;
      color: #6B7280;
    }
  `]
})
export class MarketDetailComponent {
  private route = inject(ActivatedRoute);
  public marketId = this.route.snapshot.paramMap.get('id');
}
