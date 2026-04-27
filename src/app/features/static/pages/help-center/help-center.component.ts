import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalService } from '../../../../core/services/legal.service';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="help-container">
      <header class="help-header">
        <div class="header-content">
          <h1>How can we help you?</h1>
          <p>Search our knowledge base or browse categories below.</p>
          <div class="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" placeholder="Search for articles, guides, and more...">
          </div>
        </div>
      </header>

      <section class="help-categories">
        <div class="category-card">
          <div class="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <h3>Getting Started</h3>
          <p>Learn the basics of how StakeGood works and start predicting.</p>
          <a routerLink="/arena" class="link">Explore Markets</a>
        </div>

        <div class="category-card">
          <div class="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10"/></svg>
          </div>
          <h3>Wallets & Payments</h3>
          <p>How to link your Stellar wallet and manage your funds safely.</p>
          <a routerLink="/settings" class="link">Manage Wallets</a>
        </div>

        <div class="category-card">
          <div class="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          </div>
          <h3>Security & Trust</h3>
          <p>Everything you need to know about our security protocols.</p>
          <a routerLink="/terms" class="link">View Terms</a>
        </div>

        <div class="category-card">
          <div class="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3.5z"/></svg>
          </div>
          <h3>Community & FAQ</h3>
          <p>Join the conversation and find answers to common questions.</p>
          <a href="https://discord.gg/stakegood" target="_blank" class="link">Join Discord</a>
        </div>
      </section>

      <section class="featured-articles">
        <h2>Frequently Asked Questions</h2>
        @if (legalService.loading()) {
          <div class="loading-faq">Loading FAQs...</div>
        } @else {
          <div class="faq-accordion">
            @for (item of legalService.faqItems(); track item.id) {
              <details class="faq-item">
                <summary>
                  <span class="faq-category">{{ item.category }}</span>
                  <span class="faq-question">{{ item.question }}</span>
                  <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </summary>
                <div class="faq-answer">
                  <p>{{ item.answer }}</p>
                </div>
              </details>
            }
          </div>
        }
      </section>

      <footer class="help-footer">
        <div class="contact-card">
          <h2>Still need help?</h2>
          <p>Our support team is always ready to assist you with any questions.</p>
          <a href="mailto:support@stakegood.com" class="btn-primary">Contact Support</a>
        </div>
      </footer>
    </main>
  `,
  styles: [`
    .help-container {
      background-color: #F6F8F7;
      min-height: 100%;
    }

    .help-header {
      background-color: #111815;
      padding: 5rem 1.5rem;
      text-align: center;
      color: white;
    }

    .header-content {
      max-width: 700px;
      margin: 0 auto;
    }

    .help-header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }

    .help-header p {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 2.5rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 16px;
      max-width: 600px;
      margin: 0 auto;
      color: #9CA3AF;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .search-bar input {
      border: none;
      background: transparent;
      margin-left: 1rem;
      width: 100%;
      height: 2.5rem;
      font-size: 1rem;
      outline: none;
      color: #111815;
    }

    .help-categories {
      max-width: 1100px;
      margin: -4rem auto 4rem;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .category-card {
      background: white;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .category-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.05);
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: rgba(17, 212, 138, 0.1);
      color: #11D48A;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .category-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111815;
      margin-bottom: 0.75rem;
    }

    .category-card p {
      color: #6B7280;
      font-size: 0.9375rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .category-card .link {
      color: #11D48A;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .featured-articles {
      max-width: 1100px;
      margin: 0 auto 4rem;
      padding: 0 1.5rem;
    }

    .featured-articles h2 {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      color: #111815;
    }

    .article-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .article-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
    }

    .article-item .dot {
      width: 6px;
      height: 6px;
      background: #11D48A;
      border-radius: 50%;
    }

    .article-item a {
      color: #4B5563;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .article-item a:hover {
      color: #11D48A;
    }

    .help-footer {
      max-width: 1100px;
      margin: 0 auto 6rem;
      padding: 0 1.5rem;
    }

    .contact-card {
      background: linear-gradient(135deg, #11D48A 0%, #0D9E67 100%);
      padding: 3rem;
      border-radius: 24px;
      text-align: center;
      color: white;
    }

    .contact-card h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .contact-card p {
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .btn-primary {
      background: #111815;
      color: white;
      border: none;
      padding: 1rem 2.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .btn-primary:hover {
      transform: scale(1.05);
    }

    .loading-faq {
      text-align: center;
      padding: 3rem;
      color: #6B7280;
    }

    .faq-accordion {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .faq-item {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
    }

    .faq-item summary {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      cursor: pointer;
      list-style: none;
      position: relative;
    }

    .faq-item summary::-webkit-details-marker {
      display: none;
    }

    .faq-category {
      background: rgba(17, 212, 138, 0.1);
      color: #0D9E67;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-right: 1rem;
      text-transform: uppercase;
    }

    .faq-question {
      font-weight: 600;
      color: #111815;
      flex: 1;
    }

    .chevron {
      transition: transform 0.3s;
      color: #9CA3AF;
    }

    .faq-item[open] .chevron {
      transform: rotate(180deg);
    }

    .faq-answer {
      padding: 0 1.5rem 1.5rem;
      color: #4B5563;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .help-header h1 { font-size: 2.25rem; }
      .contact-card { padding: 2rem; }
      .faq-item summary { padding: 1rem; }
    }
  `]
})
export class HelpCenterComponent implements OnInit {
  legalService = inject(LegalService);

  ngOnInit(): void {
    this.legalService.fetchFAQ();
  }
}
