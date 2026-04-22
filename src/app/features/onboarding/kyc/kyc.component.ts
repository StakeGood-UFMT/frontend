import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../../core/store/auth/auth.actions';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kyc-container">
      <div class="kyc-card">
        
        <div class="kyc-header">
          <div class="header-overlay"></div>
          <div class="icon-circle">
            <span class="icon">{{ isVerifying() ? '⏳' : '🛡️' }}</span>
          </div>
          <h1 class="title">KYC Verification</h1>
        </div>

        <div class="kyc-body">
          <h3 class="subtitle">
            {{ isVerifying() ? 'Verifying identity...' : 'Your identity verification is pending' }}
          </h3>
          <p class="description">
            To ensure a secure environment and comply with regulatory standards, we need to verify your identity before you can access all features of the Arena.
          </p>

          <button class="primary-btn" (click)="startMockVerification()" [disabled]="isVerifying()">
            {{ isVerifying() ? 'Processing...' : 'Start Verification' }}
          </button>
          
          <button class="secondary-btn" (click)="goHome()" [disabled]="isVerifying()">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kyc-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%);
      font-family: 'Inter', 'Roboto', sans-serif;
    }
    
    .kyc-card {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
      text-align: center;
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .kyc-header {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      padding: 2.5rem 2rem;
      position: relative;
    }
    
    .header-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at top right, rgba(0,0,0,0.05), transparent);
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      background: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem auto;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .icon {
      font-size: 24px;
    }

    .title {
      color: #ffffff;
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .kyc-body {
      padding: 2.5rem;
    }

    .subtitle {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .description {
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .primary-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 12px;
      background: #1e293b;
      color: white;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(30, 41, 59, 0.25);
      margin-bottom: 1rem;
    }

    .primary-btn:hover:not(:disabled) {
      background: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(30, 41, 59, 0.35);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: wait;
      transform: none;
    }

    .secondary-btn {
      width: 100%;
      padding: 0.875rem;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: #64748b;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .secondary-btn:hover:not(:disabled) {
      background: #f8fafc;
      color: #334155;
    }
    
    .secondary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class KycComponent {
  private store = inject(Store);
  private router = inject(Router);
  public isVerifying = signal(false);

  startMockVerification() {
    this.isVerifying.set(true);
    
    // Simulate a 2-second KYC verification process
    setTimeout(() => {
      this.isVerifying.set(false);
      
      // Update NgRx Profile with approved KYC
      this.store.dispatch(AuthActions.updateProfile({ profile: { kyc_status: 'approved' } }));
      
      // Redirect to Arena after approval
      this.router.navigate(['/arena']);
    }, 2000);
  }

  goHome() {
    this.router.navigate(['/landing']);
  }
}
