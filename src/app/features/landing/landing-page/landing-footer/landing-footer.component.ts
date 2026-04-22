import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer" id="footer">
      <div class="footer-inner">
        <!-- Brand -->
        <div class="footer-brand">
          <span class="brand-name">StakeGood</span>
          <p class="brand-tagline">Predictive markets with real social impact on the Stellar blockchain.</p>
          <div class="social-links">
            <a href="https://github.com/StakeGood-UFMT" target="_blank" rel="noopener" class="social-link" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>

        <!-- Links -->
        <div class="footer-links">
          <div class="links-col">
            <span class="col-title">Product</span>
            <a routerLink="/arena" class="footer-link">Arena</a>
            <a routerLink="/landing" class="footer-link">How it works</a>
          </div>
          <div class="links-col">
            <span class="col-title">Community</span>
            <a href="https://github.com/StakeGood-UFMT" target="_blank" rel="noopener" class="footer-link">GitHub</a>
            <a href="#" class="footer-link">Discord</a>
          </div>
          <div class="links-col">
            <span class="col-title">Legal</span>
            <a routerLink="/onboarding/terms" class="footer-link">Terms of Use</a>
            <a href="#" class="footer-link">Privacy</a>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span>© 2026 StakeGood — UFMT. All rights reserved.</span>
        <span class="stellar-badge">Powered by ⭐ Stellar</span>
      </div>
    </footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .footer {
      font-family: 'Inter', sans-serif;
      background: #111815;
      padding: 40px 48px 0;
    }

    .footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .brand-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: #11D48A;
      display: block;
      margin-bottom: 12px;
    }

    .brand-tagline {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.4);
      line-height: 1.7;
      margin: 0 0 20px;
      max-width: 240px;
    }

    .social-links { display: flex; gap: 12px; }
    .social-link {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.07);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.5);
      transition: all 0.2s;
      text-decoration: none;
    }
    .social-link:hover { background: rgba(17, 212, 138, 0.15); color: #11D48A; }

    .footer-links {
      grid-column: span 3;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    .links-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .col-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.35);
      margin-bottom: 4px;
    }

    .footer-link {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .footer-link:hover { color: #11D48A; }

    .footer-bottom {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.25);
    }

    .stellar-badge {
      font-weight: 600;
      color: rgba(255,255,255,0.35);
    }

    @media (max-width: 960px) {
      .footer { padding: 32px 24px 0; }
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
      .footer-links { grid-column: span 2; }
    }

    @media (max-width: 600px) {
      .footer { padding: 28px 16px 0; }
      .footer-inner { grid-template-columns: 1fr; }
      .footer-links { grid-template-columns: 1fr 1fr; gap: 24px; }
      .footer-bottom { flex-direction: column; text-align: center; }
    }
  `]
})
export class LandingFooterComponent { }
