import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="not-found-container">
      <div class="content">
        <div class="error-code">404</div>
        <h1 class="title">Lost in Space?</h1>
        <p class="description">
          The page you are looking for doesn't exist or has been moved to another dimension. 
          Let's get you back to safety.
        </p>
        <div class="actions">
          <a routerLink="/" class="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Return to Dashboard
          </a>
          <a routerLink="/landing" class="btn-secondary">View Landing Page</a>
        </div>
      </div>
      <div class="decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>
    </main>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      background-color: #F6F8F7;
    }

    .content {
      max-width: 500px;
      text-align: center;
      z-index: 10;
    }

    .error-code {
      font-size: clamp(6rem, 15vw, 10rem);
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #11D48A 0%, #0D9E67 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      letter-spacing: -0.05em;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #111815;
      margin-bottom: 1.5rem;
    }

    .description {
      font-size: 1.125rem;
      color: #6B7280;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background-color: #111815;
      color: white;
      padding: 0.875rem 1.75rem;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      background-color: #1a2420;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      background-color: transparent;
      color: #111815;
      padding: 0.875rem 1.75rem;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      border: 2px solid #E5E7EB;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background-color: #F3F4F6;
      border-color: #D1D5DB;
    }

    .decoration {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }

    .circle-1 {
      width: 400px;
      height: 400px;
      background-color: #11D48A;
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 300px;
      height: 300px;
      background-color: #11D48A;
      bottom: -50px;
      left: -50px;
    }

    @media (max-width: 640px) {
      .title { font-size: 2rem; }
      .actions { flex-direction: column; }
      .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
    }
  `]
})
export class NotFoundComponent { }
