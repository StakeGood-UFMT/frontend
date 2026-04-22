import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { WalletService } from '../../../../core/services/wallet.service';

@Component({
  selector: 'app-connect-wallet-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="cta-section" id="connect">
      <div class="cta-inner">
        <!-- Card -->
        <div class="connect-card">
          <!-- State: Not Connected -->
          <ng-container *ngIf="!isLoggedIn()">
            <div class="card-graphic">
              <div class="graphic-ring ring-3"></div>
              <div class="graphic-ring ring-2"></div>
              <div class="graphic-ring ring-1"></div>
              <div class="graphic-center">⚡</div>
            </div>

            <div class="card-text">
              <h2 class="card-title">Ready to get started?</h2>
              <p class="card-desc">
                Connect your Stellar wallet in seconds and access all Arenas.
                No email. No password. Just you and your wallet.
              </p>
            </div>

            <div class="card-actions">
              <button
                id="cta-connect-wallet-btn"
                class="big-connect-btn"
                [disabled]="isConnecting()"
                [class.loading]="isConnecting()"
                (click)="connect()"
              >
                <span *ngIf="!isConnecting()" class="btn-icon">⚡</span>
                <span class="spinner" *ngIf="isConnecting()"></span>
                {{ isConnecting() ? 'Connecting wallet...' : 'Connect Wallet Now' }}
              </button>

              <div *ngIf="errorMsg()" class="error-msg">
                ⚠️ {{ errorMsg() }}
              </div>

              <div class="wallet-hints">
                <span>We support:</span>
                <span class="wallet-pill">Freighter</span>
                <span class="wallet-pill">xBull</span>
                <span class="wallet-pill">Albedo</span>
                <span class="wallet-pill">WalletConnect</span>
              </div>
            </div>
          </ng-container>

          <!-- State: Connected -->
          <ng-container *ngIf="isLoggedIn()">
            <div class="card-graphic">
              <div class="graphic-ring ring-3 ring-active"></div>
              <div class="graphic-ring ring-2 ring-active"></div>
              <div class="graphic-ring ring-1 ring-active"></div>
              <div class="graphic-center graphic-center-active">✅</div>
            </div>

            <div class="card-text">
              <h2 class="card-title">Wallet connected!</h2>
              <p class="card-desc">
                Welcome, <strong>{{ shortAddress() }}</strong>.<br>
                You can now participate in all Arenas.
              </p>
            </div>

            <div class="card-actions">
              <a routerLink="/arena" id="cta-go-arena-btn" class="big-connect-btn connected-btn">
                🏆 Go to Arena
              </a>
              <button (click)="logout()" class="logout-link">
                Disconnect wallet
              </button>
            </div>
          </ng-container>
        </div>

        <!-- Social proof -->
        <div class="social-proof">
          <div *ngFor="let t of testimonials" class="testimonial">
            <div class="t-avatar">{{ t.avatar }}</div>
            <div class="t-body">
              <p class="t-text">"{{ t.text }}"</p>
              <span class="t-author">— {{ t.author }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .cta-section {
      font-family: 'Inter', sans-serif;
      background: #FFFFFF;
      padding: 56px 48px;
    }

    .cta-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }

    /* Connect Card */
    .connect-card {
      background: linear-gradient(145deg, #111815 0%, #0d2018 100%);
      border-radius: 28px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 32px;
      border: 1px solid rgba(17, 212, 138, 0.15);
      box-shadow: 0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(17,212,138,0.05);
    }

    /* Graphic rings */
    .card-graphic {
      position: relative;
      width: 80px;
      height: 80px;
    }
    .graphic-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(17, 212, 138, 0.15);
      animation: ripple 3s ease-in-out infinite;
    }
    .ring-1 { width: 48px; height: 48px; top: 16px; left: 16px; animation-delay: 0s; }
    .ring-2 { width: 64px; height: 64px; top: 8px; left: 8px; animation-delay: 0.4s; }
    .ring-3 { width: 80px; height: 80px; top: 0; left: 0; animation-delay: 0.8s; }

    .ring-active { border-color: rgba(17, 212, 138, 0.4); }

    @keyframes ripple {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    .graphic-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.5rem;
      z-index: 1;
    }
    .graphic-center-active { font-size: 1.4rem; }

    /* Card text */
    .card-title {
      font-size: 1.7rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }
    .card-desc {
      font-size: 0.95rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.7;
      margin: 0;
    }
    .card-text { display: flex; flex-direction: column; }

    /* Actions */
    .card-actions {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .big-connect-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      background: linear-gradient(135deg, #11D48A 0%, #0BB574 100%);
      color: #111815;
      font-weight: 800;
      font-size: 1rem;
      padding: 16px 24px;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(17, 212, 138, 0.35);
      text-decoration: none;
    }
    .big-connect-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(17, 212, 138, 0.5);
    }
    .big-connect-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .big-connect-btn.loading { pointer-events: none; }
    .connected-btn { background: linear-gradient(135deg, #11D48A, #059669); }

    .btn-icon { font-size: 1.1rem; }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(17,212,138,0.4);
      border-top: 2px solid #111815;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-msg {
      font-size: 0.85rem;
      color: #FCA5A5;
      background: rgba(239, 68, 68, 0.1);
      padding: 10px 14px;
      border-radius: 10px;
      border-left: 3px solid #EF4444;
    }

    .logout-link {
      background: none;
      border: none;
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
      cursor: pointer;
      text-align: center;
      transition: color 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .logout-link:hover { color: rgba(255,255,255,0.6); }

    .wallet-hints {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.35);
    }
    .wallet-pill {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.5);
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.7rem;
    }

    /* Testimonials */
    .social-proof {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .testimonial {
      display: flex;
      gap: 16px;
      padding: 20px 24px;
      background: #F9FAFB;
      border-radius: 18px;
      border: 1px solid rgba(0,0,0,0.06);
      transition: all 0.2s;
    }
    .testimonial:hover {
      border-color: rgba(17, 212, 138, 0.2);
      transform: translateX(4px);
    }

    .t-avatar {
      font-size: 2rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .t-body { display: flex; flex-direction: column; gap: 6px; }
    .t-text {
      font-size: 0.88rem;
      color: #374151;
      font-style: italic;
      line-height: 1.6;
      margin: 0;
    }
    .t-author {
      font-size: 0.75rem;
      color: #9CA3AF;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 960px) {
      .cta-section { padding: 40px 24px; }
      .cta-inner { grid-template-columns: 1fr; }
    }

    @media (max-width: 600px) {
      .cta-section { padding: 32px 16px; }
      .connect-card { padding: 28px 24px; }
      .card-title { font-size: 1.4rem; }
    }
  `]
})
export class ConnectWalletCardComponent {
  private auth = inject(AuthService);
  private wallet = inject(WalletService);

  public isLoggedIn = this.auth.isLoggedIn;
  public isConnecting = this.wallet.isConnecting;
  public errorMsg = signal<string | null>(null);

  public shortAddress = computed(() => {
    const profile = this.auth.profile();
    if (!profile) return '';
    const addr = profile.public_key;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  });

  async connect() {
    this.errorMsg.set(null);
    try {
      await this.auth.login();
    } catch (e: any) {
      this.errorMsg.set(e?.message || 'Failed to connect. Please try again.');
    }
  }

  logout() {
    this.auth.logout();
  }

  testimonials = [
    {
      avatar: '🧑‍💻',
      text: 'Connected in under a minute with Freighter. Made my first stake and already saw the donation confirmed on-chain.',
      author: 'Carlos M., staker since Jan/25'
    },
    {
      avatar: '🧕',
      text: 'I never thought investing in social causes could be this direct and transparent. Amazing!',
      author: 'Ana R., verified user'
    },
    {
      avatar: '🏢',
      text: 'Our perfect partner for verifiable impact. The on-chain metrics save us hours of reporting.',
      author: 'Doctors Solidarity NGO'
    }
  ];
}
