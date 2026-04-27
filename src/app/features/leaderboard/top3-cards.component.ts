import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from './leaderboard.service';

@Component({
  selector: 'app-top3-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top3-grid">
      <div class="card" *ngFor="let user of items; let i = index">
        <div class="rank">#{{ user.rank ?? (i + 1) }}</div>
        <div class="avatar" *ngIf="!privateMode && user.avatar_url">
          <img [src]="user.avatar_url" alt="avatar" />
        </div>
        <div class="meta">
          <div class="name">{{ privateMode ? 'Anonymous User' : user.username }}</div>
          <div class="rep">{{ user.reputation | number }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .top3-grid { display: flex; gap: 1rem; align-items: stretch; }
    .card { flex: 1; background: white; border-radius: 14px; padding: 1rem; display: flex; gap: 0.75rem; align-items: center; box-shadow: 0 6px 18px rgba(2,6,23,0.06); }
    .rank { font-weight: 900; font-size: 1.25rem; color: var(--primary-color); width: 48px; text-align: center; }
    .avatar img { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; }
    .meta .name { font-weight: 800; }
    .meta .rep { color: var(--text-muted); font-size: 0.95rem; }
  `]
})
export class Top3CardsComponent {
  @Input() items: LeaderboardEntry[] = [];
  @Input() privateMode = false;
}
