import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="hero">
      <h1>Invest in <span>Impact</span></h1>
      <p>The decentralized oracle for social good. Proof of impact, powered by Stellar.</p>
    </div>
  `,
  styles: [`
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
      font-weight: 800;
    }

    h1 span {
      color: #11D48A;
    }

    p {
      font-size: 18px;
      color: #4b5563;
      max-width: 600px;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      h1 { font-size: 48px; }
    }
  `]
})
export class LandingComponent {}
