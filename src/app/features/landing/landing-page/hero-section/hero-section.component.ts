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
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="headline">
            TRANSFORM YOUR PREDICTIONS<br>
            INTO SOCIAL IMPACT
          </h1>
          
          <p class="subheadline">
            The first prediction market where your insights fund <strong>critical philanthropic projects worldwide</strong>. 
            Predict outcomes, drive donations, and create real change.
          </p>

          <div class="cta-container">
            <button
              *ngIf="!isLoggedIn()"
              class="btn-action"
              [class.loading]="isConnecting()"
              [disabled]="isConnecting()"
              (click)="connect()"
            >
              <span class="loader" *ngIf="isConnecting()"></span>
              <span>{{ isConnecting() ? 'Connecting...' : 'START PREDICTING & GIVING' }}</span>
            </button>

            <div *ngIf="isLoggedIn()" class="connected-state">
              <div class="connected-badge">
                <span class="dot"></span>
                Connected to Stellar
              </div>
              <a routerLink="/arena" class="btn-arena">Go to Arena →</a>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <img src="/social-impact-hero-v2.png" alt="Social Impact Illustration" class="illustration">
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #eef9f9 0%, #ffffff 100%);
      padding: 60px 40px 20px;
      min-height: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .hero-container {
      max-width: 1280px;
      width: 100%;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      align-items: center;
      gap: 48px;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .headline {
      font-size: clamp(2.2rem, 4.5vw, 3.8rem);
      font-weight: 900;
      line-height: 1.1;
      color: #0d1b15;
      margin: 0;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }

    .subheadline {
      font-size: 1.15rem;
      color: #4b5563;
      max-width: 580px;
      line-height: 1.6;
      margin: 0;
    }

    .subheadline strong {
      color: #0d1b15;
      font-weight: 700;
    }

    .cta-container {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(90deg, #1e70d1 0%, #11d48a 100%);
      color: white;
      font-weight: 800;
      font-size: 1.1rem;
      padding: 18px 36px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px rgba(30, 112, 209, 0.25);
    }

    .btn-action:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(30, 112, 209, 0.35);
      filter: brightness(1.05);
    }

    .connected-state {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 12px;
    }

    .connected-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(17, 212, 138, 0.1);
      padding: 8px 16px;
      border-radius: 999px;
      font-weight: 600;
      color: #0a8a57;
      font-size: 0.9rem;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: #11d48a;
      border-radius: 50%;
    }

    .btn-arena {
      color: #1e70d1;
      font-weight: 700;
      text-decoration: none;
      font-size: 1rem;
    }

    .hero-visual {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .illustration {
      max-width: 100%;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 20px 40px rgba(0,0,0,0.05));
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 40px;
      }
      .hero-content {
        align-items: center;
      }
      .subheadline {
        margin: 0 auto;
      }
      .hero-visual {
        order: -1;
      }
      .illustration {
        max-width: 80%;
      }
    }

    @media (max-width: 640px) {
      .hero {
        padding: 40px 20px 0;
      }
      .headline {
        font-size: 1.8rem;
      }
      .btn-action {
        width: 100%;
        justify-content: center;
      }
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
