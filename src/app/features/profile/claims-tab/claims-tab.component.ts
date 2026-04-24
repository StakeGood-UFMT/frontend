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
      gap: 2rem;
      animation: fadeIn 0.4s ease-out;
    }

    .tab-header .description {
      color: #9ca3af;
      font-size: 0.95rem;
      max-width: 600px;
      line-height: 1.5;
    }

    .tab-footer {
      margin-top: 1rem;
    }

    .info-card {
      display: flex;
      padding: 1rem;
      background: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.1);
      border-radius: 8px;
      align-items: center;
    }

    .info-card p {
      margin: 0;
      font-size: 0.85rem;
      color: #60a5fa;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .info-icon {
      font-size: 1.1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClaimsTabComponent {}
