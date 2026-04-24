import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimsTabComponent } from './claims-tab/claims-tab.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ClaimsTabComponent],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>My Account</h1>
        <p>Manage your predictions, claims and settings.</p>
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
          (click)="activeTab.set('settings')" 
          [class.active]="activeTab() === 'settings'"
        >
          Settings
        </button>
      </nav>

      <main class="tab-content">
        <div *ngIf="activeTab() === 'activity'" class="placeholder-tab">
          <div class="tab-icon">📊</div>
          <h3>Your Activity</h3>
          <p>Recent stakes and results will appear here.</p>
        </div>

        <app-claims-tab *ngIf="activeTab() === 'claims'"></app-claims-tab>

        <div *ngIf="activeTab() === 'settings'" class="placeholder-tab">
          <div class="tab-icon">⚙️</div>
          <h3>Settings</h3>
          <p>Wallet and security preferences.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      animation: slideIn 0.5s ease-out;
    }

    .profile-header {
      margin-bottom: 3rem;
    }

    .profile-header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 0%, #6b7280 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .profile-header p {
      color: #9ca3af;
      font-size: 1.1rem;
    }

    .profile-tabs {
      display: flex;
      gap: 2rem;
      border-bottom: 1px solid #374151;
      margin-bottom: 2.5rem;
    }

    .profile-tabs button {
      background: none;
      border: none;
      color: #9ca3af;
      padding: 1rem 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .profile-tabs button:hover {
      color: #fff;
    }

    .profile-tabs button.active {
      color: #10b981;
    }

    .profile-tabs button.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: #10b981;
      border-radius: 99px;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }

    .tab-content {
      min-height: 400px;
    }

    .placeholder-tab {
      padding: 5rem 2rem;
      text-align: center;
      background: rgba(31, 41, 55, 0.3);
      border: 1px solid #374151;
      border-radius: 20px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .tab-icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    .placeholder-tab h3 {
      color: #fff;
      margin: 0;
      font-size: 1.5rem;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProfileComponent {
  activeTab = signal('claims');
}
