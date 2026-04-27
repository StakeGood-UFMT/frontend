import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { Top3CardsComponent } from './top3-cards.component';
import { LeaderboardTableComponent } from './leaderboard-table.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Top3CardsComponent, LeaderboardTableComponent],
  template: `
    <div class="page">
      <div class="header">
        <h1>Leaderboard</h1>
        <div class="controls">
          <select [(ngModel)]="range">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <input [(ngModel)]="q" placeholder="Search users..." />
          <button (click)="reload()">Search</button>
        </div>
      </div>

      <div *ngIf="loading()" class="loading">Loading leaderboard…</div>

      <app-top3-cards [items]="top3()" [privateMode]="privateMode()"></app-top3-cards>

      <div style="height:16px"></div>

      <app-leaderboard-table
        [data]="entries()"
        [total]="total()"
        [page]="page()"
        [limit]="limit()"
        [privateMode]="privateMode()"
        (pageChange)="setPage($event)">
      </app-leaderboard-table>
    </div>
  `,
  styles: [`
    .page { max-width: 980px; margin: 0 auto; padding: 1rem; display:flex; flex-direction:column; gap:1rem; }
    .header { display:flex; justify-content:space-between; align-items:center; }
    .controls { display:flex; gap:0.5rem; align-items:center; }
    select, input { padding:0.5rem; border-radius:8px; border:1px solid #e5e7eb; }
    button { padding:0.5rem 0.75rem; border-radius:8px; background:linear-gradient(135deg,#11D48A,#0fb87a); color:white; border:none; }
    .loading { color: var(--text-muted); padding: 1rem; }
  `]
})
export class LeaderboardPage implements OnInit {
  private svc = inject(LeaderboardService);
  private settingsSvc = inject(SettingsService);

  // Signals
  entries = signal<LeaderboardEntry[]>([]);
  top3 = signal<LeaderboardEntry[]>([]);
  total = signal(0);
  loading = signal(false);

  page = signal(1);
  limit = signal(10);
  range = signal<'7d' | '30d' | 'all'>('7d');
  q = '';

  // Derived
  privateMode = () => this.settingsSvc.settings()?.privateMode ?? false;

  constructor() {
    // proper DI handled by Angular at runtime; these are placeholders to satisfy TS in this repo layout
    // The actual inject happens when Angular bootstraps the standalone component.
  }

  async ngOnInit() {
    // Try to ensure user settings are loaded (SettingsService manages its own fetch)
    try {
      await this.settingsSvc.fetchSettings();
    } catch (_) {}
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const resp = await lastValueFrom(this.svc.getLeaderboard(this.range(), this.q, this.page(), this.limit()));
      this.entries.set(resp.items ?? []);
      this.top3.set(resp.top3 ?? (resp.items?.slice(0, 3) ?? []));
      this.total.set(resp.total ?? (resp.items?.length ?? 0));
    } catch (e) {
      this.entries.set([]);
      this.top3.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  async reload() { this.page.set(1); await this.load(); }

  async setPage(p: number) { this.page.set(p); await this.load(); }
}
