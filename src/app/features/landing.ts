import { Component } from '@angular/core';
import { WalletConnect } from '../shared/components/wallet-connect';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [WalletConnect],
  template: `
    <div class="landing-page">
      <header class="top-bar">
        <div class="logo">StakeGood</div>
        <app-wallet-connect></app-wallet-connect>
      </header>

      <main class="hero">
        <h1>Invest in <span>Impact</span></h1>
        <p>The decentralized oracle for social good. Proof of impact, powered by Stellar.</p>
      </main>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background-color: #F6F8F7;
      color: #111815;
      font-family: 'Inter', sans-serif;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 40px;
    }

    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #11D48A;
    }

    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 20px;
      text-align: center;
    }

    h1 {
      font-size: 64px;
      margin-bottom: 20px;
    }

    h1 span {
      color: #11D48A;
    }

    p {
      font-size: 18px;
      color: #4b5563;
      max-width: 600px;
    }
  `]
})
export class Landing {}
