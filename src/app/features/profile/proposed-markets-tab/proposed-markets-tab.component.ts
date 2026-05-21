import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ProposalService,
  ProposalSummary,
  ProposalStatus,
} from '../../proposals/services/proposal.service';

@Component({
  selector: 'app-proposed-markets-tab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="proposed-wrapper">
      <header class="list-header">
        <div class="header-left">
          <h2>Proposed Markets</h2>
          <p class="subtitle">Track the status of markets you proposed.</p>
        </div>
        <button (click)="load()" class="refresh-btn" [disabled]="loading()">
          <span [class.spinning]="loading()">↻</span> Refresh
        </button>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="skeleton-list">
          <div *ngFor="let i of [1,2,3]" class="skeleton-item"></div>
        </div>
      </div>

      <div *ngIf="!loading() && !!error()" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>{{ error() }}</p>
      </div>

      <div
        *ngIf="!loading() && !error() && proposals().length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📝</div>
        <p>You haven't proposed any markets yet.</p>
        <small>Use the “Propose Market” button to create your first one.</small>
      </div>

      <div
        *ngIf="!loading() && !error() && proposals().length > 0"
        class="proposals-grid"
      >
        <div *ngFor="let p of paginatedProposals()" class="proposal-row">
          <div class="proposal-info">
            <div class="title-line">
              <span class="proposal-title">{{ p.title }}</span>
              <span class="status-badge" [class]="statusClass(p.status)">
                {{ statusLabel(p.status) }}
              </span>
            </div>

            <div class="proposal-meta">
              <span>Created: {{ p.createdAt | date:'mediumDate' }}</span>
              <span>Lock: {{ p.lockAt | date:'mediumDate' }}</span>
              <span>Resolve: {{ p.resolveAt | date:'mediumDate' }}</span>
            </div>

            <div *ngIf="p.status === 'REJECTED' && p.rejectionReason" class="reason">
              Reason: {{ p.rejectionReason }}
            </div>

            <!-- NGO Candidates -->
            <div *ngIf="p.ngo_candidates && p.ngo_candidates.length > 0" class="ngo-candidates-strip">
              <span class="ngo-candidates-label">🤝 NGO Candidates</span>
              <div class="ngo-candidates-list">
                <a *ngFor="let ngo of p.ngo_candidates"
                   [routerLink]="['/ngos', ngo.slug]"
                   class="ngo-candidate-chip"
                   [title]="ngo.name"
                >
                  <span *ngIf="ngo.logo_url" class="chip-avatar">
                    <img [src]="ngo.logo_url" [alt]="ngo.name" />
                  </span>
                  <span class="chip-name">{{ ngo.name }}</span>
                  <span *ngIf="ngo.verified" class="chip-verified">✓</span>
                </a>
              </div>
            </div>
          </div>
          <div class="proposal-actions">
            <button class="details-btn" (click)="openDetails(p)">
              Details
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination" *ngIf="!loading() && !error() && proposals().length > limit">
        <button [disabled]="page() === 1" (click)="page.set(page() - 1)" class="pagination-btn">
          Previous
        </button>
        <span class="pagination-info">
          Page {{ page() }} of {{ Math.ceil(proposals().length / limit) }}
        </span>
        <button [disabled]="page() * limit >= proposals().length" (click)="page.set(page() + 1)" class="pagination-btn">
          Next
        </button>
      </div>

      <div
        *ngIf="selectedProposal()"
        class="modal-overlay"
        (click)="closeDetails()"
      >
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="modal-title">
              <h3>{{ selectedProposal()!.title }}</h3>
              <span class="status-badge" [class]="statusClass(selectedProposal()!.status)">
                {{ statusLabel(selectedProposal()!.status) }}
              </span>
            </div>
            <button class="close-btn" (click)="closeDetails()">✕</button>
          </header>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Category</span>
                <span class="detail-value">{{ selectedProposal()!.category || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created At</span>
                <span class="detail-value">{{ selectedProposal()!.createdAt | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Lock</span>
                <span class="detail-value">{{ selectedProposal()!.lockAt | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Resolve</span>
                <span class="detail-value">{{ selectedProposal()!.resolveAt | date:'medium' }}</span>
              </div>
            </div>

            <div class="detail-block" *ngIf="selectedProposal()!.description">
              <div class="detail-label">Description</div>
              <div class="detail-text">{{ selectedProposal()!.description }}</div>
            </div>

            <div class="detail-block" *ngIf="selectedProposal()!.resolutionRule">
              <div class="detail-label">Resolution Rule</div>
              <div class="detail-text">{{ selectedProposal()!.resolutionRule }}</div>
            </div>

            <div class="detail-block" *ngIf="selectedProposal()!.resolutionSource">
              <div class="detail-label">Resolution Source</div>
              <div class="detail-text">{{ selectedProposal()!.resolutionSource }}</div>
            </div>

            <div class="detail-links">
              <a
                *ngIf="selectedProposal()!.oracleUrl"
                class="link"
                [href]="selectedProposal()!.oracleUrl!"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Oracle URL
              </a>
              <a
                *ngIf="selectedProposal()!.imageUrl"
                class="link"
                [href]="selectedProposal()!.imageUrl!"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Image URL
              </a>
            </div>

            <div
              *ngIf="selectedProposal()!.status === 'REJECTED' && selectedProposal()!.rejectionReason"
              class="reason"
            >
              Reason: {{ selectedProposal()!.rejectionReason }}
            </div>

            <!-- NGO Candidates in Modal -->
            <div *ngIf="selectedProposal()!.ngo_candidates && selectedProposal()!.ngo_candidates!.length > 0" class="ngo-candidates-modal-block">
              <div class="detail-label">🤝 NGO Candidates</div>
              <div class="ngo-modal-cards">
                <a *ngFor="let ngo of selectedProposal()!.ngo_candidates!"
                   [routerLink]="['/ngos', ngo.slug]"
                   (click)="closeDetails()"
                   class="ngo-modal-card"
                >
                  <div class="ngo-modal-avatar" *ngIf="ngo.logo_url">
                    <img [src]="ngo.logo_url" [alt]="ngo.name" />
                  </div>
                  <div class="ngo-modal-avatar ngo-modal-avatar-fallback" *ngIf="!ngo.logo_url">🌱</div>
                  <div class="ngo-modal-info">
                    <span class="ngo-modal-name">{{ ngo.name }}</span>
                    <span *ngIf="ngo.category" class="ngo-modal-category">{{ ngo.category }}</span>
                  </div>
                  <div class="ngo-modal-right">
                    <span *ngIf="ngo.verified" class="verified-badge">✓ Verified</span>
                    <span class="ngo-modal-link-label">View →</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="tab-footer">
        <div class="info-card">
          <p>
            <span class="info-icon">ℹ️</span>
            If a market is approved, it may show up in the Arena after admin moderation/signature.
          </p>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .proposed-wrapper {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeInUp 0.4s ease-out;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 4px;
      }

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .list-header h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #111815;
      }

      .subtitle {
        margin: 0;
        color: #6b7280;
        font-size: 0.85rem;
        line-height: 1.4;
      }

      .refresh-btn {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #6b7280;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .refresh-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #11d48a;
        color: #11d48a;
      }

      .refresh-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .proposals-grid {
        display: grid;
        gap: 10px;
      }

      .proposal-row {
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        padding: 8px 14px;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
      }

      .proposal-row:hover {
        border-color: rgba(17, 212, 138, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      }

      .proposal-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-grow: 1;
        min-width: 0;
      }

      .proposal-actions {
        display: flex;
        align-items: center;
      }

      .details-btn {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #111815;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 800;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .details-btn:hover {
        background: #f9fafb;
        border-color: #11d48a;
        color: #0eb87a;
      }

      .title-line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .proposal-title {
        font-weight: 800;
        font-size: 0.92rem;
        color: #111815;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .proposal-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 0.8rem;
        color: #6b7280;
      }

      .reason {
        font-size: 0.8rem;
        color: #b45309;
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.18);
        padding: 6px 10px;
        border-radius: 8px;
        margin-top: 2px;
      }

      .status-badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        background: #f3f4f6;
        color: #6b7280;
        flex: 0 0 auto;
      }

      .status-badge.pending {
        background: rgba(245, 158, 11, 0.10);
        color: #b45309;
      }

      .status-badge.approved {
        background: rgba(17, 212, 138, 0.08);
        color: #0eb87a;
      }

      .status-badge.rejected {
        background: rgba(239, 68, 68, 0.08);
        color: #dc2626;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 1000;
      }

      .modal {
        width: 100%;
        max-width: 720px;
        background: #ffffff;
        border-radius: 18px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      .modal-header {
        padding: 16px 18px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .modal-title h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 900;
        color: #111815;
      }

      .close-btn {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 10px;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        cursor: pointer;
        font-weight: 900;
        color: #6b7280;
        transition: all 0.2s;
        flex: 0 0 auto;
      }

      .close-btn:hover {
        background: #f9fafb;
        border-color: rgba(239, 68, 68, 0.25);
        color: #dc2626;
      }

      .modal-body {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .detail-item {
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 14px;
        padding: 12px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .detail-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .detail-value {
        font-size: 0.92rem;
        font-weight: 700;
        color: #111815;
      }

      .detail-block {
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 14px;
        padding: 12px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-text {
        font-size: 0.9rem;
        color: #111815;
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .detail-links {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #0eb87a;
        font-weight: 800;
        font-size: 0.85rem;
        text-decoration: none;
        background: rgba(17, 212, 138, 0.05);
        transition: all 0.2s;
      }

      .link:hover {
        border-color: rgba(17, 212, 138, 0.25);
        background: rgba(17, 212, 138, 0.08);
      }

      @media (max-width: 640px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }

      .loading-state,
      .empty-state {
        padding: 48px 24px;
        text-align: center;
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #6b7280;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .empty-icon {
        font-size: 2.5rem;
        margin-bottom: 2px;
      }

      .skeleton-list {
        display: grid;
        gap: 10px;
        width: 100%;
      }

      .skeleton-item {
        height: 60px;
        background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        border-radius: 12px;
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .tab-footer {
        margin-top: 8px;
      }

      .info-card {
        display: flex;
        padding: 16px;
        background: rgba(17, 212, 138, 0.05);
        border: 1px solid rgba(17, 212, 138, 0.1);
        border-radius: 12px;
        align-items: center;
      }

      .info-card p {
        margin: 0;
        font-size: 0.82rem;
        color: #0eb87a;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        line-height: 1.4;
      }

      .info-icon {
        font-size: 1.1rem;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Pagination CSS */
      .pagination {
        display: flex;
        gap: 12px;
        justify-content: center;
        align-items: center;
        padding: 12px 0;
        margin-top: 16px;
      }

      .pagination-btn {
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: white;
        color: #4b5563;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pagination-btn:hover:not(:disabled) {
        border-color: #11D48A;
        color: #11D48A;
        background: #f9fafb;
      }

      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-info {
        font-size: 0.78rem;
        color: #6b7280;
        font-weight: 600;
      }

      /* NGO Candidates Strip (in proposal list row) */
      .ngo-candidates-strip {
        display: flex;
        flex-direction: column;
        gap: 5px;
        background: rgba(17,212,138,0.04);
        border: 1px solid rgba(17,212,138,0.1);
        border-radius: 8px;
        padding: 7px 10px;
        margin-top: 6px;
      }

      .ngo-candidates-label {
        font-size: 0.65rem;
        font-weight: 700;
        color: #0eb87a;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .ngo-candidates-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .ngo-candidate-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        background: white;
        border: 1px solid rgba(17,212,138,0.2);
        border-radius: 20px;
        font-size: 0.72rem;
        font-weight: 700;
        color: #374151;
        text-decoration: none;
        transition: all 0.15s;
      }

      .ngo-candidate-chip:hover {
        background: rgba(17,212,138,0.07);
        border-color: #11D48A;
        color: #0eb87a;
      }

      .chip-avatar {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        overflow: hidden;
        flex-shrink: 0;
      }

      .chip-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .chip-name {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chip-verified {
        color: #0eb87a;
        font-size: 0.65rem;
      }

      /* NGO candidates block inside modal */
      .ngo-candidates-modal-block {
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 14px;
        padding: 12px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ngo-modal-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ngo-modal-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: #f9fafb;
        border: 1px solid rgba(17,212,138,0.12);
        border-radius: 10px;
        text-decoration: none;
        transition: all 0.2s;
      }

      .ngo-modal-card:hover {
        background: rgba(17,212,138,0.05);
        border-color: rgba(17,212,138,0.25);
        transform: translateX(4px);
      }

      .ngo-modal-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        border: 1px solid rgba(17,212,138,0.15);
      }

      .ngo-modal-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ngo-modal-avatar-fallback {
        background: rgba(17,212,138,0.07);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }

      .ngo-modal-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-grow: 1;
        min-width: 0;
      }

      .ngo-modal-name {
        font-size: 0.92rem;
        font-weight: 800;
        color: #111815;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ngo-modal-category {
        font-size: 0.72rem;
        color: #6b7280;
      }

      .ngo-modal-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }

      .verified-badge {
        font-size: 0.65rem;
        font-weight: 700;
        color: #0eb87a;
        background: rgba(17,212,138,0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .ngo-modal-link-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: #0eb87a;
      }
    `,
  ],
})
export class ProposedMarketsTabComponent implements OnInit {
  private proposalService = inject(ProposalService);

  protected proposals = signal<ProposalSummary[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected selectedProposal = signal<ProposalSummary | null>(null);
  protected page = signal(1);
  protected limit = 5;

  Math = Math;

  protected paginatedProposals = computed(() => {
    const start = (this.page() - 1) * this.limit;
    return this.proposals().slice(start, start + this.limit);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proposalService.listMine().subscribe({
      next: (rows) => {
        this.proposals.set(rows ?? []);
        this.page.set(1);
      },
      error: () => {
        this.error.set('Unable to load your proposed markets.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  statusLabel(status: ProposalStatus): string {
    if (status === 'PENDING') return 'PENDING';
    if (status === 'APPROVED') return 'APPROVED';
    return 'REJECTED';
  }

  statusClass(status: ProposalStatus): string {
    return status.toLowerCase();
  }

  openDetails(proposal: ProposalSummary): void {
    this.selectedProposal.set(proposal);
  }

  closeDetails(): void {
    this.selectedProposal.set(null);
  }
}
