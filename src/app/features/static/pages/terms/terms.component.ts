import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="terms-container">
      <div class="terms-card">
        <header class="terms-header">
          <div class="badge">Legal Document</div>
          <h1>Terms of Use</h1>
          <div class="version-info">
            <span class="version">Version 2.1.0</span>
            <span class="dot"></span>
            <span class="date">Last updated: April 27, 2026</span>
          </div>
        </header>

        <nav class="terms-toc">
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#acceptance">1. Acceptance of Terms</a></li>
            <li><a href="#eligibility">2. Eligibility</a></li>
            <li><a href="#account">3. Account Responsibility</a></li>
            <li><a href="#blockchain">4. Blockchain & Stellar Network</a></li>
            <li><a href="#risk">5. Risk Disclosure</a></li>
          </ul>
        </nav>

        <section class="terms-content">
          <div id="acceptance" class="term-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the StakeGood platform, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </div>

          <div id="eligibility" class="term-section">
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years of age and have the legal capacity to enter into a binding agreement to use StakeGood. By using the platform, you represent and warrant that you meet these requirements.
            </p>
          </div>

          <div id="account" class="term-section">
            <h2>3. Account Responsibility</h2>
            <p>
              You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </div>

          <div id="blockchain" class="term-section">
            <h2>4. Blockchain & Stellar Network</h2>
            <p>
              StakeGood operates on the Stellar blockchain. You acknowledge that blockchain transactions are irreversible and that we have no control over the Stellar network's performance or fees.
            </p>
          </div>

          <div id="risk" class="term-section">
            <h2>5. Risk Disclosure</h2>
            <p>
              Participating in predictive markets involves significant financial risk. StakeGood is not a financial advisor, and you should only use funds you can afford to lose.
            </p>
          </div>
        </section>

        <footer class="terms-footer">
          <p>Questions about our terms? <a href="mailto:legal@stakegood.com">Contact our legal team</a></p>
        </footer>
      </div>
    </main>
  `,
  styles: [`
    .terms-container {
      padding: 3rem 1.5rem;
      background-color: #F6F8F7;
      min-height: 100%;
      display: flex;
      justify-content: center;
    }

    .terms-card {
      background: white;
      max-width: 800px;
      width: 100%;
      padding: 3rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    }

    .terms-header {
      margin-bottom: 3rem;
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(17, 212, 138, 0.1);
      color: #0D9E67;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #111815;
      margin-bottom: 1rem;
    }

    .version-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: #6B7280;
      font-size: 0.875rem;
    }

    .dot {
      width: 4px;
      height: 4px;
      background: #D1D5DB;
      border-radius: 50%;
    }

    .terms-toc {
      background: #F9FAFB;
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 3rem;
    }

    .terms-toc h3 {
      font-size: 1rem;
      margin-bottom: 1rem;
      color: #111815;
    }

    .terms-toc ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .terms-toc a {
      color: #6B7280;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .terms-toc a:hover {
      color: #11D48A;
    }

    .term-section {
      margin-bottom: 2.5rem;
    }

    .term-section h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111815;
      margin-bottom: 1rem;
    }

    .term-section p {
      color: #4B5563;
      line-height: 1.7;
      font-size: 1rem;
    }

    .terms-footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #F3F4F6;
      text-align: center;
      color: #9CA3AF;
      font-size: 0.875rem;
    }

    .terms-footer a {
      color: #11D48A;
      text-decoration: none;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .terms-card { padding: 1.5rem; }
      h1 { font-size: 2rem; }
    }
  `]
})
export class TermsComponent { }
