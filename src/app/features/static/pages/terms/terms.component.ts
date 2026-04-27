import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalService } from '../../../../core/services/legal.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="terms-container">
      @if (legalService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading terms...</p>
        </div>
      } @else if (legalService.error()) {
        <div class="error-state">
          <p>{{ legalService.error() }}</p>
          <button (click)="legalService.fetchCurrentTerms()" class="btn-retry">Try Again</button>
        </div>
      } @else {
        @if (legalService.terms(); as terms) {
          <div class="terms-card">
            <header class="terms-header">
              <div class="badge">Legal Document</div>
              <h1>Terms of Use</h1>
              <div class="version-info">
                <span class="version">Version {{ terms.version }}</span>
                <span class="dot"></span>
                <span class="date">Last updated: {{ terms.updatedAt | date:'longDate' }}</span>
              </div>
            </header>

            <nav class="terms-toc">
              <h3>Table of Contents</h3>
              <ul>
                @for (section of terms.sections; track section.id) {
                  <li><a [href]="'#' + section.id">{{ $index + 1 }}. {{ section.title }}</a></li>
                }
              </ul>
            </nav>

            <section class="terms-content">
              @for (section of terms.sections; track section.id) {
                <div [id]="section.id" class="term-section">
                  <h2>{{ $index + 1 }}. {{ section.title }}</h2>
                  <div [innerHTML]="section.body"></div>
                </div>
              }
            </section>

            <footer class="terms-footer">
              <p>Questions about our terms? <a href="mailto:legal@stakegood.com">Contact our legal team</a></p>
            </footer>
          </div>
        }
      }
    </main>
  `,
  styles: [`
    .terms-container {
      padding: 3rem 1.5rem;
      background-color: #F6F8F7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(17, 212, 138, 0.1);
      border-top: 4px solid #11D48A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .btn-retry {
      background: #111815;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
      cursor: pointer;
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
export class TermsComponent implements OnInit {
  legalService = inject(LegalService);

  ngOnInit(): void {
    this.legalService.fetchCurrentTerms();
  }
}
