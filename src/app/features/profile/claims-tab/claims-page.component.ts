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
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .page-header {
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #6b7280 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-header p {
      color: #9ca3af;
      font-size: 1.1rem;
    }
  `]
})
export class ClaimsPageComponent {}
