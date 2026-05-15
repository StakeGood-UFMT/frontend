import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { KeeperTTLComponent } from '../keeper-ttl/keeper-ttl.component';
import { MarketAdminComponent } from '../market-admin/market-admin.component';
import { ProposalModerationComponent } from '../proposal-moderation/proposal-moderation.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KeeperTTLComponent,
    MarketAdminComponent,
    ProposalModerationComponent
  ],
  template: `
    <div class="dashboard-page">
      <div class="dashboard-container">
        <header class="dashboard-header">
          <div class="header-info">
            <h1 class="dashboard-title">Admin Operations</h1>
            <p class="dashboard-subtitle">Centralized control for StakeGood protocol management.</p>
          </div>
          
          <nav class="dashboard-tabs">
            <button 
              *ngFor="let tab of tabs" 
              [class.active]="activeTab() === tab.id"
              (click)="setActiveTab(tab.id)"
              class="tab-btn"
              [title]="tab.label"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </nav>
        </header>

        <main class="dashboard-viewport">
          <div class="view-wrapper" [ngClass]="activeTab()">
            <app-keeper-ttl *ngIf="activeTab() === 'keeper'"></app-keeper-ttl>
            <app-market-admin *ngIf="activeTab() === 'markets'"></app-market-admin>
            <app-proposal-moderation *ngIf="activeTab() === 'proposals'"></app-proposal-moderation>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #F8FAFC;
    }

    .dashboard-page {
      padding: 20px;
      animation: fadeIn 0.4s ease-out;
    }

    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    @media (min-width: 1024px) {
      .dashboard-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .dashboard-title {
      font-family: 'Public Sans', sans-serif;
      font-size: 1.8rem;
      font-weight: 850;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.03em;
    }

    .dashboard-subtitle {
      font-size: 0.95rem;
      color: #64748B;
      margin: 2px 0 0 0;
      font-weight: 500;
    }

    .dashboard-tabs {
      display: flex;
      gap: 4px;
      background: #FFFFFF;
      padding: 4px;
      border-radius: 14px;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      width: fit-content;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 10px;
      cursor: pointer;
      color: #64748B;
      font-weight: 700;
      font-size: 0.85rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #10B981;
      background: rgba(16, 185, 129, 0.05);
    }

    .tab-btn.active {
      background: #10B981;
      color: #FFFFFF;
    }

    .tab-icon {
      font-size: 1rem;
    }

    .dashboard-viewport {
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.03);
      min-height: 600px;
      overflow: hidden;
      padding: 20px;
    }

    .view-wrapper {
      animation: slideIn 0.3s ease-out;
    }

    /* Override individual component styles when inside dashboard */
    :host ::ng-deep .admin-page {
      padding: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
      animation: none !important;
    }

    :host ::ng-deep .admin-header {
      display: none !important;
    }

    .dashboard-viewport {
      background: #FFFFFF;
      border-radius: 32px;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);
      min-height: 700px;
      overflow: hidden;
      padding: 32px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }

  `]
})
export class AdminDashboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tabs = [
    { id: 'proposals', label: 'Proposal Moderation', icon: '📝' },
    { id: 'markets', label: 'Market Admin', icon: '🏢' },
    { id: 'keeper', label: 'Keeper TTL', icon: '⚙️' }
  ];

  activeTab = signal('proposals');

  constructor() {
    // Read initial tab from query params if present
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam && this.tabs.find(t => t.id === tabParam)) {
      this.activeTab.set(tabParam);
    }

    // Effect to update URL when tab changes
    effect(() => {
      const currentTab = this.activeTab();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: currentTab },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }, { allowSignalWrites: true });
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }
}
