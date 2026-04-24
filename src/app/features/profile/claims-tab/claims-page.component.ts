import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimsTabComponent } from './claims-tab.component';

@Component({
  selector: 'app-claims-page',
  standalone: true,
  imports: [CommonModule, ClaimsTabComponent],
  template: `
    <div class="claims-page-container">
      <header class="page-header">
        <h1>Claims</h1>
        <p>Withdraw your winnings from resolved prediction markets.</p>
      </header>
      
      <app-claims-tab></app-claims-tab>
    </div>
  `,
  styles: [`
    .claims-page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.4s ease-out;
    }

    .page-header {
      margin-bottom: 8px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
    }

    .page-header p {
      margin: 6px 0 0;
      font-size: 0.92rem;
      color: #6b7280;
      line-height: 1.5;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClaimsPageComponent {}
