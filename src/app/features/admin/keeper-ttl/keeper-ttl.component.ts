import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminMarketTTL } from '../../../core/models/admin.model';
import { NotificationService } from '../../../core/services/notification.service';
import { KeeperTTLTableComponent } from './components/keeper-ttl-table.component';

@Component({
  selector: 'app-keeper-ttl',
  standalone: true,
  imports: [CommonModule, KeeperTTLTableComponent],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <h1 class="title">Keeper TTL Management</h1>
        <p class="subtitle">Maintain on-chain state rent for eligible markets.</p>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading markets...</p>
      </div>

      <app-keeper-ttl-table
        *ngIf="!loading()"
        [markets]="markets()"
        (bumpBatch)="onBumpBatch($event)"
      ></app-keeper-ttl-table>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      animation: fadeIn 0.4s ease-out;
    }
    .admin-header {
      margin-bottom: 32px;
    }
    .title {
      font-family: 'Public Sans', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: #111815;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 1.1rem;
      color: #64748b;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 100px 0;
      color: #64748b;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(16, 185, 129, 0.1);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class KeeperTTLComponent implements OnInit {
  private adminService = inject(AdminService);
  private notify = inject(NotificationService);

  markets = signal<AdminMarketTTL[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadMarkets();
  }

  loadMarkets() {
    this.loading.set(true);
    this.adminService.getEligibleMarkets().subscribe({
      next: (data: AdminMarketTTL[]) => {
        this.markets.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.notify.error('Failed to load eligible markets');
        this.loading.set(false);
      }
    });
  }

  onBumpBatch(marketIds: string[]) {
    if (!confirm(`Confirm batch bump TTL for ${marketIds.length} markets?`)) return;

    this.adminService.batchBumpTTL(marketIds).subscribe({
      next: () => {
        this.notify.success('Batch bump TTL submitted successfully');
        this.loadMarkets();
      },
      error: (err: any) => {
        this.notify.error('Failed to execute batch bump TTL');
      }
    });
  }
}
