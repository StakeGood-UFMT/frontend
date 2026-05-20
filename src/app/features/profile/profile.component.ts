import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClaimsTabComponent } from './claims-tab/claims-tab.component';
import { ProposedMarketsTabComponent } from './proposed-markets-tab/proposed-markets-tab.component';
import { ActivityTabComponent } from './activity-tab/activity-tab.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ClaimsTabComponent, ProposedMarketsTabComponent, ActivityTabComponent],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">👤</span>
            My Account
          </h1>
          <p class="page-subtitle">
            Manage your predictions, claims and settings.
          </p>
        </div>
        <button class="propose-btn" routerLink="/proposals/new">
          <span class="btn-icon">✨</span>
          Propose Market
        </button>
      </div>

      <nav class="profile-tabs">
        <button 
          (click)="activeTab.set('activity')" 
          [class.active]="activeTab() === 'activity'"
        >
          Activity
        </button>
        <button 
          (click)="activeTab.set('claims')" 
          [class.active]="activeTab() === 'claims'"
        >
          Claims
        </button>
        <button 
          (click)="activeTab.set('proposed')" 
          [class.active]="activeTab() === 'proposed'"
        >
          Proposed Markets
        </button>
      </nav>

      <main class="tab-content">
        <app-activity-tab *ngIf="activeTab() === 'activity'"></app-activity-tab>

        <app-claims-tab *ngIf="activeTab() === 'claims'"></app-claims-tab>

        <app-proposed-markets-tab
          *ngIf="activeTab() === 'proposed'"
        ></app-proposed-markets-tab>
      </main>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.4s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-icon {
      font-size: 1.5rem;
    }

    .page-subtitle {
      margin: 6px 0 0;
      font-size: 0.92rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .propose-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #11D48A;
      color: #111815;
      border: none;
      border-radius: 14px;
      padding: 12px 20px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.15);
    }

    .propose-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(17, 212, 138, 0.25);
      background: #0ebf7b;
    }

    .propose-btn:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    .profile-tabs {
      display: flex;
      gap: 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding: 0 4px;
    }

    .profile-tabs button {
      background: none;
      border: none;
      color: #6b7280;
      padding: 12px 0;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .profile-tabs button:hover {
      color: #111815;
    }

    .profile-tabs button.active {
      color: #11D48A;
    }

    .profile-tabs button.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: #11D48A;
      border-radius: 99px;
      box-shadow: 0 2px 10px rgba(17, 212, 138, 0.2);
    }

    .tab-content {
      min-height: 400px;
      animation: fadeInUp 0.5s ease-out 0.1s both;
    }

    .state-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    .state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 32px;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      max-width: 420px;
      width: 100%;
      animation: fadeInUp 0.4s ease-out;
    }

    .state-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .state-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111815;
      margin: 0 0 8px;
    }

    .state-message {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
    }

    @media (max-width: 768px) {
      .profile-page {
        padding: 4px 0;
        gap: 18px;
      }
      .profile-tabs {
        gap: 20px;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      .propose-btn {
        justify-content: center;
      }
    }
  `]
})
export class ProfileComponent {
  activeTab = signal('activity');
}
