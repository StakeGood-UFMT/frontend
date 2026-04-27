import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from './leaderboard.service';

@Component({
  selector: 'app-leaderboard-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrap">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Reputation</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of data">
            <td>{{ u.rank }}</td>
            <td class="user-cell">
              <div class="avatar" *ngIf="!privateMode && u.avatar_url"><img [src]="u.avatar_url" alt="avatar"/></div>
              <div class="name">{{ privateMode ? 'Anonymous User' : u.username }}</div>
            </td>
            <td class="rep">{{ u.reputation | number }}</td>
          </tr>
          <tr *ngIf="!data || data.length === 0">
            <td colspan="3" class="empty">No results found.</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page === 1" (click)="onPage(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ Math.ceil(total / limit) }}</span>
        <button [disabled]="page * limit >= total" (click)="onPage(page + 1)">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .table-wrap { background: rgba(255,255,255,0.85); border-radius: 14px; padding: 0.5rem; }
    .leaderboard-table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; font-weight: 700; color: var(--text-muted); }
    td { padding: 12px; border-top: 1px solid rgba(0,0,0,0.04); }
    .user-cell { display:flex; gap: 0.75rem; align-items:center; }
    .avatar img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
    .rep { font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .empty { text-align:center; padding: 32px; color: var(--text-muted); }
    .pagination { display:flex; gap: 1rem; justify-content:center; align-items:center; padding: 12px; }
    .pagination button { padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; }
  `]
})
export class LeaderboardTableComponent {
  @Input() data: LeaderboardEntry[] = [];
  @Input() total = 0;
  @Input() page = 1;
  @Input() limit = 10;
  @Input() privateMode = false;
  @Output() pageChange = new EventEmitter<number>();

  Math = Math;

  onPage(p: number) { this.pageChange.emit(p); }
}
