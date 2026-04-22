import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../../core/store/auth/auth.actions';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <div class="terms-card">
        
        <div class="terms-header">
          <div class="header-overlay"></div>
          <h1 class="title">Terms of Use</h1>
          <p class="subtitle">Please read carefully before accessing the platform</p>
        </div>

        <div class="terms-body">
          <div class="scrollable-content">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using StakeGood, you agree to comply with and be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our services.</p>
            
            <h3>2. Cryptoasset Operations</h3>
            <p>You acknowledge that StakeGood facilitates donations and stakes using the Stellar network. All blockchain transactions are irreversible and subject to market volatility. The platform is not responsible for losses due to price fluctuations.</p>
            
            <h3>3. Compliance and KYC</h3>
            <p>Full use of the platform is conditional upon passing our Know Your Customer (KYC) identity verification process. We reserve the right to suspend accounts that show suspicious activity or violate applicable laws.</p>
            
            <h3>4. Privacy</h3>
            <p>Your data will be handled in accordance with our Privacy Policy. By accepting these terms, you also consent to the processing of your personal information as described in the policy.</p>
          </div>

          <label class="checkbox-wrapper" [class.checked]="accepted()">
            <div class="custom-checkbox">
              <input type="checkbox" [checked]="accepted()" (change)="toggleAccept()" />
              <div class="checkmark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span class="checkbox-text">
              I have read and agree to all the Terms of Use and Privacy Policy.
            </span>
          </label>

          <button class="submit-btn" [class.disabled]="!accepted()" (click)="submit()" [disabled]="!accepted()">
            Confirm and Continue
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .terms-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%);
      font-family: 'Inter', 'Roboto', sans-serif;
    }
    
    .terms-card {
      width: 100%;
      max-width: 600px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .terms-header {
      background: linear-gradient(135deg, #11D48A 0%, #0eb575 100%);
      padding: 2rem;
      text-align: center;
      position: relative;
    }
    
    .header-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent);
    }

    .title {
      color: #ffffff;
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      margin: 0.5rem 0 0 0;
      font-size: 1rem;
      position: relative;
      z-index: 1;
    }

    .terms-body {
      padding: 2rem;
    }

    .scrollable-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      height: 250px;
      overflow-y: auto;
      margin-bottom: 2rem;
      color: #475569;
      font-size: 0.9rem;
      line-height: 1.6;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    
    .scrollable-content h3 {
      color: #1e293b;
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    
    .scrollable-content p {
      margin-bottom: 1.5rem;
    }
    
    .scrollable-content::-webkit-scrollbar {
      width: 6px;
    }
    .scrollable-content::-webkit-scrollbar-track {
      background: transparent; 
    }
    .scrollable-content::-webkit-scrollbar-thumb {
      background: #cbd5e1; 
      border-radius: 10px;
    }

    .checkbox-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;
    }
    
    .checkbox-wrapper:hover {
      background: #f8fafc;
    }

    .custom-checkbox {
      position: relative;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    
    .custom-checkbox input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 0; left: 0;
      height: 24px; width: 24px;
      background-color: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .checkbox-wrapper:hover .custom-checkbox input ~ .checkmark {
      border-color: #94a3b8;
    }

    .custom-checkbox input:checked ~ .checkmark {
      background-color: #11D48A;
      border-color: #11D48A;
    }

    .checkmark svg {
      width: 14px;
      height: 14px;
      color: white;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .custom-checkbox input:checked ~ .checkmark svg {
      opacity: 1;
      transform: scale(1);
    }

    .checkbox-text {
      color: #334155;
      font-weight: 500;
      font-size: 0.95rem;
      line-height: 1.5;
      padding-top: 0.1rem;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 12px;
      background: #11D48A;
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.3);
    }

    .submit-btn:not(.disabled):hover {
      background: #0eb575;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(17, 212, 138, 0.4);
    }

    .submit-btn.disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  `]
})
export class TermsComponent {
  private store = inject(Store);
  private router = inject(Router);
  public accepted = signal(false);

  toggleAccept() {
    this.accepted.set(!this.accepted());
  }

  submit() {
    if (this.accepted()) {
      // Dispara a action para atualizar o profile com termos aceitos
      this.store.dispatch(AuthActions.updateProfile({ profile: { terms_accepted: true } }));
      
      // Redireciona para a arena após o aceite
      this.router.navigate(['/arena']);
    }
  }
}
