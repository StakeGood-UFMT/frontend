import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { WalletService } from '../../../../core/services/wallet.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero" id="hero">
      <!-- Decorative blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="hero-inner">
        <!-- Badge -->
        <div class="badge">
          <span class="badge-dot"></span>
          Powered by Stellar Network
        </div>

        <!-- Headline -->
        <h1 class="headline">
          Predictive Markets<br>
          for <span class="highlight">Social Impact</span>
        </h1>

        <!-- Subheadline -->
        <p class="subheadline">
          Stake with your Stellar wallet, generate real impact and verify outcomes on-chain.
          <strong>Transparent predictions. Verifiable philanthropy.</strong>
        </p>

        <!-- CTA Row -->
        <div class="cta-row">
          <!-- Connect Wallet button (stateful) -->
          <button
            *ngIf="!isLoggedIn()"
            id="hero-connect-wallet-btn"
            class="btn-primary"
            [class.loading]="isConnecting()"
            [disabled]="isConnecting()"
            (click)="connect()"
          >
            <span class="btn-icon" *ngIf="!isConnecting()">⚡</span>
            <span class="loader" *ngIf="isConnecting()"></span>
            <span>{{ isConnecting() ? 'Connecting...' : 'Connect Wallet' }}</span>
          </button>

          <!-- Connected state -->
          <div *ngIf="isLoggedIn()" class="connected-badge">
            <span class="connected-dot"></span>
            Wallet Connected — <a routerLink="/arena" class="go-arena">Go to Arena →</a>
          </div>

          <!-- Learn More (smooth scroll) -->
          <a href="#features" class="btn-secondary" id="hero-learn-more-btn">
            How it works
          </a>
        </div>

        <!-- Error -->
        <div *ngIf="errorMsg" class="hero-error">
          ⚠️ {{ errorMsg }}
        </div>

        <!-- Trust signals -->
        <div class="trust-row">
          <div class="trust-item">🔒 Non-custodial</div>
          <div class="trust-item">📜 Open source</div>
          <div class="trust-item">💸 No hidden fees</div>
        </div>
      </div>

      <!-- Hero visual -->
      <div class="hero-visual">
        <div class="card-mockup">
          <div class="card-header">
            <span class="card-tag">🏆 Active Arena</span>
            <span class="card-prize">$5,200 at stake</span>
          </div>
          <div class="card-question">
            Which NGO will reach its fundraising goal by December 2025?
          </div>
          <div class="card-options">
            <div class="option option-a">
              <span class="opt-label">Doctors Without Borders</span>
              <span class="opt-pct">62%</span>
              <div class="opt-bar"><div class="opt-fill" style="width:62%"></div></div>
            </div>
            <div class="option option-b">
              <span class="opt-label">Red Cross BR</span>
              <span class="opt-pct">38%</span>
              <div class="opt-bar"><div class="opt-fill opt-fill-b" style="width:38%"></div></div>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-timer">⏰ 47 days left</span>
            <span class="card-participants">👥 138 stakers</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .hero {
      font-family: 'Inter', sans-serif;
      background: #F6F8F7;
      min-height: calc(100vh - 64px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 32px;
      padding: 48px 48px 40px;
      position: relative;
      overflow: hidden;
    }

    /* Decorative blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.25;
      pointer-events: none;
    }
    .blob-1 {
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, #11D48A, transparent 70%);
      top: -120px;
      left: -100px;
      animation: float 8s ease-in-out infinite;
    }
    .blob-2 {
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, #0BB574, transparent 70%);
      bottom: -80px;
      right: 200px;
      animation: float 10s ease-in-out infinite reverse;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-24px) scale(1.04); }
    }

    .hero-inner {
      display: flex;
      flex-direction: column;
      gap: 28px;
      z-index: 1;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(17, 212, 138, 0.12);
      color: #0a8a57;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      width: fit-content;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #11D48A;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.8); }
    }

    /* Headline */
    .headline {
      font-size: clamp(2.4rem, 4vw, 3.6rem);
      font-weight: 900;
      line-height: 1.1;
      color: #111815;
      margin: 0;
      letter-spacing: -0.03em;
    }
    .highlight {
      color: #11D48A;
      position: relative;
    }
    .highlight::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #11D48A, #0BB574);
      border-radius: 2px;
      opacity: 0.5;
    }

    /* Subheadline */
    .subheadline {
      font-size: 1.05rem;
      color: #4b5563;
      max-width: 520px;
      line-height: 1.7;
      margin: 0;
    }

    /* CTA Row */
    .cta-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #11D48A 0%, #0BB574 100%);
      color: #111815;
      font-weight: 800;
      font-size: 1rem;
      padding: 14px 28px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(17, 212, 138, 0.35);
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(17, 212, 138, 0.5);
    }
    .btn-primary:disabled { opacity: 0.75; cursor: not-allowed; }
    .btn-primary.loading { pointer-events: none; }

    .btn-icon { font-size: 1.1rem; }

    .loader {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(17,212,138,0.4);
      border-top: 2px solid #111815;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .connected-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #0a8a57;
      font-size: 0.95rem;
    }
    .connected-dot {
      width: 10px;
      height: 10px;
      background: #11D48A;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    .go-arena {
      color: #11D48A;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .go-arena:hover { opacity: 0.75; }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #374151;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 14px;
      border: 1.5px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      background: #fff;
      border-color: rgba(0,0,0,0.2);
      transform: translateY(-2px);
    }

    /* Error */
    .hero-error {
      background: #FEF2F2;
      color: #991B1B;
      font-size: 0.875rem;
      padding: 10px 16px;
      border-radius: 10px;
      border-left: 3px solid #EF4444;
      animation: fadeUp 0.3s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Trust row */
    .trust-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
    }
    .trust-item {
      font-size: 0.8rem;
      color: #6B7280;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ---- Card Mockup (Visual) ---- */
    .hero-visual {
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1;
      animation: floatCard 6s ease-in-out infinite;
    }
    @keyframes floatCard {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }

    .card-mockup {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 28px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.10), 0 4px 12px rgba(17,212,138,0.08);
      border: 1px solid rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0a8a57;
      background: rgba(17, 212, 138, 0.12);
      padding: 4px 10px;
      border-radius: 999px;
    }
    .card-prize {
      font-size: 0.8rem;
      font-weight: 700;
      color: #374151;
    }

    .card-question {
      font-size: 0.95rem;
      font-weight: 600;
      color: #111815;
      line-height: 1.5;
    }

    .card-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .option {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .opt-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }
    .opt-pct {
      font-size: 0.8rem;
      font-weight: 700;
      color: #11D48A;
      align-self: flex-end;
      margin-top: -20px;
    }
    .opt-bar {
      height: 6px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
    }
    .opt-fill {
      height: 100%;
      background: linear-gradient(90deg, #11D48A, #0BB574);
      border-radius: 999px;
      transition: width 1s ease;
    }
    .opt-fill-b {
      background: linear-gradient(90deg, #93C5FD, #60A5FA);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #9CA3AF;
      font-weight: 600;
    }

    /* ---- Responsive ---- */
    @media (max-width: 960px) {
      .hero {
        grid-template-columns: 1fr;
        padding: 40px 24px 40px;
        min-height: auto;
        gap: 32px;
      }
      .hero-visual { order: -1; }
      .card-mockup { max-width: 100%; }
      .headline { font-size: 2.2rem; }
    }

    @media (max-width: 600px) {
      .hero { padding: 32px 16px 32px; }
      .headline { font-size: 2rem; }
      .cta-row { flex-direction: column; align-items: stretch; }
      .btn-primary, .btn-secondary { justify-content: center; }
      .trust-row { gap: 10px; }
    }
  `]
})
export class HeroSectionComponent {
  private auth = inject(AuthService);
  private wallet = inject(WalletService);

  public isLoggedIn = this.auth.isLoggedIn;
  public isConnecting = this.wallet.isConnecting;
  public errorMsg: string | null = null;

  async connect() {
    this.errorMsg = null;
    try {
      await this.auth.login();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to connect wallet. Please try again.';
    }
  }
}
