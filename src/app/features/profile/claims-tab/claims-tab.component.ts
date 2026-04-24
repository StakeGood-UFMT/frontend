import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimsListComponent } from './claims-list.component';

@Component({
  selector: 'app-claims-tab',
  standalone: true,
  imports: [CommonModule, ClaimsListComponent],
  template: `
    <div class="claims-tab-wrapper">
      <div class="tab-header">
        <p class="description">
          Claim your rewards from resolved markets. Payouts are sent directly to your Stellar wallet.
        </p>
      </div>
      
      <app-claims-list></app-claims-list>
      
      <footer class="tab-footer">
        <div class="info-card">
          <p>
            <span class="info-icon">ℹ️</span>
            Claims remain available indefinitely until you withdraw them. Network fees apply for each claim transaction.
          </p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .claims-tab-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.4s ease-out;
    }

    .tab-header .description {
      color: #6b7280;
      font-size: 0.92rem;
      max-width: 600px;
      line-height: 1.6;
      margin: 0;
    }

    .tab-footer {
      margin-top: 8px;
    }

    .info-card {
      display: flex;
      padding: 16px;
      background: rgba(17, 212, 138, 0.05);
      border: 1px solid rgba(17, 212, 138, 0.1);
      border-radius: 12px;
      align-items: center;
    }

    .info-card p {
      margin: 0;
      font-size: 0.82rem;
      color: #0eb87a;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      line-height: 1.4;
    }

    .info-icon {
      font-size: 1.1rem;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClaimsTabComponent {}
