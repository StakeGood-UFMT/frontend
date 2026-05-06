import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  ProposalService,
  ProposalStatus,
  ProposalSummary,
} from '../../proposals/services/proposal.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WalletService } from '../../../core/services/wallet.service';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../../../core/config/api.config';

@Component({
  selector: 'app-proposal-moderation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-content">
          <h1 class="title">Proposal Moderation</h1>
          <p class="subtitle">Review and approve/reject proposed markets.</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <span class="stat-label">Pending</span>
            <span class="stat-value">{{ pendingCount() }}</span>
          </div>
        </div>
      </header>

      <nav class="filters">
        <button
          class="filter-btn"
          [class.active]="statusFilter() === 'PENDING'"
          (click)="setFilter('PENDING')"
        >
          Pending
        </button>
        <button
          class="filter-btn"
          [class.active]="statusFilter() === 'APPROVED'"
          (click)="setFilter('APPROVED')"
        >
          Approved
        </button>
        <button
          class="filter-btn"
          [class.active]="statusFilter() === 'REJECTED'"
          (click)="setFilter('REJECTED')"
        >
          Rejected
        </button>
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">
          <span [class.spinning]="loading()">↻</span> Refresh
        </button>
      </nav>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading proposals...</p>
      </div>

      <div *ngIf="!loading() && !!error()" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>{{ error() }}</p>
      </div>

      <div *ngIf="!loading() && !error() && proposals().length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>No proposals found for this filter.</p>
      </div>

      <div *ngIf="!loading() && !error() && proposals().length > 0" class="proposal-grid">
        <div *ngFor="let p of proposals()" class="proposal-card">
          <div class="proposal-main">
            <div class="top-line">
              <span class="category-chip">{{ p.category || 'Uncategorized' }}</span>
              <span class="status-badge" [class]="statusClass(p.status)">{{ p.status }}</span>
            </div>
            <h3 class="proposal-title">{{ p.title }}</h3>
            <div class="meta">
              <span>Proposer: {{ proposerLabel(p) }}</span>
              <span>Created: {{ p.createdAt | date:'mediumDate' }}</span>
              <span>Lock: {{ p.lockAt | date:'mediumDate' }}</span>
              <span>Resolve: {{ p.resolveAt | date:'mediumDate' }}</span>
            </div>
            <div *ngIf="p.status === 'REJECTED' && p.rejectionReason" class="reason">
              Reason: {{ p.rejectionReason }}
            </div>
          </div>
          <div class="proposal-actions">
            <button class="review-btn" (click)="openDetails(p)">Review</button>
          </div>
        </div>
      </div>

      <div *ngIf="selectedProposal()" class="modal-overlay" (click)="closeDetails()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="modal-title">
              <h3>{{ selectedProposal()!.title }}</h3>
              <span class="status-badge" [class]="statusClass(selectedProposal()!.status)">
                {{ selectedProposal()!.status }}
              </span>
            </div>
            <button class="close-btn" (click)="closeDetails()">✕</button>
          </header>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Proposer</span>
                <span class="detail-value">{{ proposerLabel(selectedProposal()!) }}</span>
              </div>
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
              <div class="detail-item">
                <span class="detail-label">Proposal ID</span>
                <span class="detail-value mono">{{ selectedProposal()!.id }}</span>
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

            <div class="decision">
              <label class="text-label" for="rejectionReason">Rejection reason (required to reject)</label>
              <textarea
                id="rejectionReason"
                class="text-area"
                [value]="rejectionReason()"
                (input)="rejectionReason.set(($any($event.target).value || '').toString())"
                rows="3"
                placeholder="Explain why this proposal is rejected..."
              ></textarea>

              <div class="decision-actions">
                <button
                  class="approve-btn"
                  (click)="approveSelected()"
                  [disabled]="actionLoading() || !canApproveSelected()"
                >
                  Approve
                </button>
                <button
                  class="reject-btn"
                  (click)="rejectSelected()"
                  [disabled]="actionLoading() || selectedProposal()!.status !== 'PENDING'"
                >
                  Reject
                </button>
              </div>
              <div class="hint">
                Approving generates an XDR to create the market on-chain. You'll be asked to sign it in your wallet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
        animation: fadeIn 0.4s ease-out;
        font-family: 'Public Sans', sans-serif;
      }

      .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 22px;
        gap: 16px;
      }

      .title {
        font-size: 2.2rem;
        font-weight: 900;
        color: #111815;
        margin: 0 0 8px;
        letter-spacing: -0.02em;
      }

      .subtitle {
        font-size: 1.05rem;
        color: #64748b;
        margin: 0;
      }

      .header-stats {
        display: flex;
        gap: 12px;
      }

      .stat-card {
        background: #ffffff;
        padding: 14px 18px;
        border-radius: 16px;
        border: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        min-width: 140px;
      }

      .stat-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 900;
        color: #f59e0b;
      }

      .filters {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .filter-btn {
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #6b7280;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 900;
        font-size: 0.85rem;
        transition: all 0.2s;
      }

      .filter-btn.active {
        border-color: rgba(245, 158, 11, 0.35);
        background: rgba(245, 158, 11, 0.08);
        color: #b45309;
      }

      .refresh-btn {
        margin-left: auto;
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #6b7280;
        padding: 10px 14px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .refresh-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: rgba(17, 212, 138, 0.2);
        color: #0eb87a;
      }

      .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      .proposal-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }

      .proposal-card {
        background: #ffffff;
        border-radius: 18px;
        border: 1px solid #f1f5f9;
        padding: 18px 20px;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        align-items: flex-start;
        transition: all 0.2s;
      }

      .proposal-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
      }

      .proposal-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .top-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .category-chip {
        font-size: 0.7rem;
        font-weight: 900;
        color: #0eb87a;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .proposal-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 900;
        color: #111815;
        line-height: 1.25;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        color: #6b7280;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .proposal-actions {
        display: flex;
        align-items: flex-start;
      }

      .review-btn {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #111815;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 900;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .review-btn:hover {
        background: #f9fafb;
        border-color: rgba(245, 158, 11, 0.35);
        color: #b45309;
      }

      .status-badge {
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: #f3f4f6;
        color: #6b7280;
        flex: 0 0 auto;
      }

      .status-badge.pending {
        background: rgba(245, 158, 11, 0.12);
        color: #b45309;
      }

      .status-badge.approved {
        background: rgba(16, 185, 129, 0.12);
        color: #047857;
      }

      .status-badge.rejected {
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
      }

      .reason {
        font-size: 0.85rem;
        color: #b45309;
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.18);
        padding: 10px 12px;
        border-radius: 12px;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 90px 0;
        color: #64748b;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(245, 158, 11, 0.12);
        border-top-color: #f59e0b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 14px;
      }

      .empty-state {
        padding: 64px 32px;
        text-align: center;
        background: #ffffff;
        border-radius: 20px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #6b7280;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .empty-icon {
        font-size: 3rem;
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
        max-width: 820px;
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
        font-weight: 900;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .detail-value {
        font-size: 0.92rem;
        font-weight: 800;
        color: #111815;
        overflow-wrap: anywhere;
      }

      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
          'Courier New', monospace;
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
        font-weight: 900;
        font-size: 0.85rem;
        text-decoration: none;
        background: rgba(17, 212, 138, 0.05);
        transition: all 0.2s;
      }

      .link:hover {
        border-color: rgba(17, 212, 138, 0.25);
        background: rgba(17, 212, 138, 0.08);
      }

      .decision {
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        padding-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .text-label {
        font-size: 0.82rem;
        font-weight: 900;
        color: #111815;
      }

      .text-area {
        width: 100%;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 14px;
        padding: 10px 12px;
        font-size: 0.9rem;
        outline: none;
        resize: vertical;
        font-family: inherit;
      }

      .text-area:focus {
        border-color: rgba(245, 158, 11, 0.4);
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
      }

      .decision-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .approve-btn,
      .reject-btn {
        border: none;
        border-radius: 12px;
        padding: 10px 14px;
        font-weight: 900;
        cursor: pointer;
        transition: all 0.2s;
      }

      .approve-btn {
        background: rgba(16, 185, 129, 0.14);
        color: #047857;
      }

      .approve-btn:hover:not(:disabled) {
        background: rgba(16, 185, 129, 0.2);
      }

      .reject-btn {
        background: rgba(239, 68, 68, 0.14);
        color: #dc2626;
      }

      .reject-btn:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.2);
      }

      .approve-btn:disabled,
      .reject-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .hint {
        font-size: 0.82rem;
        color: #6b7280;
        line-height: 1.45;
      }

      @media (max-width: 640px) {
        .admin-header {
          flex-direction: column;
          align-items: stretch;
        }
        .refresh-btn {
          margin-left: 0;
        }
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ProposalModerationComponent implements OnInit {
  private proposalService = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private walletService = inject(WalletService);
  private http = inject(HttpClient);

  protected statusFilter = signal<ProposalStatus>('PENDING');
  protected proposals = signal<ProposalSummary[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected pendingCount = signal(0);

  protected selectedProposal = signal<ProposalSummary | null>(null);
  protected rejectionReason = signal('');
  protected actionLoading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  setFilter(status: ProposalStatus): void {
    this.statusFilter.set(status);
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [pending, filtered] = await Promise.all([
        firstValueFrom(this.proposalService.listAll('PENDING')),
        firstValueFrom(this.proposalService.listAll(this.statusFilter())),
      ]);
      this.pendingCount.set((pending ?? []).length);
      this.proposals.set(filtered ?? []);
    } catch {
      this.error.set('Unable to load proposals.');
    } finally {
      this.loading.set(false);
    }
  }

  statusClass(status: ProposalStatus): string {
    return status.toLowerCase();
  }

  proposerLabel(p: ProposalSummary): string {
    const wallet = p.user?.primaryWallet;
    if (!wallet) return '-';
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
  }

  openDetails(p: ProposalSummary): void {
    this.selectedProposal.set(p);
    this.rejectionReason.set(p.rejectionReason ?? '');
    this.actionLoading.set(false);
  }

  closeDetails(): void {
    this.selectedProposal.set(null);
    this.rejectionReason.set('');
    this.actionLoading.set(false);
  }

  async approveSelected(): Promise<void> {
    const p = this.selectedProposal();
    if (!p) return;
    const repair = p.status === 'APPROVED' && !p.marketId;
    if (p.status !== 'PENDING' && !repair) return;

    this.actionLoading.set(true);
    const toastId = this.notificationService.show(
      repair ? 'Preparing repair transaction...' : 'Preparing approval transaction...',
      'pending',
      undefined,
      true,
    );

    try {
      const build = await firstValueFrom(this.proposalService.buildApprovalXdr(p.id));

      this.notificationService.update(toastId, { message: 'Awaiting signature...' });

      const { signedTxXdr } = await this.walletService.signTransaction(build.xdr);
      this.notificationService.update(toastId, { message: 'Submitting transaction...' });

      await firstValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.submit}`, {
          signedXdr: signedTxXdr,
        }),
      );

      this.notificationService.update(toastId, { message: 'Finalizing approval...' });

      await firstValueFrom(this.proposalService.moderate(p.id, { status: 'APPROVED' }));

      this.notificationService.update(toastId, {
        message: 'Approval submitted successfully.',
        type: 'success',
        persistent: false,
      });

      await this.load();
      this.closeDetails();
    } catch (e: any) {
      const msg =
        e?.error?.message ||
        e?.message ||
        'Failed to approve proposal.';
      this.notificationService.update(toastId, {
        message: msg,
        type: 'error',
        persistent: false,
      });
      this.actionLoading.set(false);
    }
  }

  canApproveSelected(): boolean {
    const p = this.selectedProposal();
    if (!p) return false;
    if (p.status === 'PENDING') return true;
    return p.status === 'APPROVED' && !p.marketId;
  }

  async rejectSelected(): Promise<void> {
    const p = this.selectedProposal();
    if (!p || p.status !== 'PENDING') return;

    const reason = (this.rejectionReason() || '').trim();
    if (!reason) {
      this.notificationService.error('Rejection reason is required.');
      return;
    }

    this.actionLoading.set(true);
    const toastId = this.notificationService.show(
      'Rejecting proposal...',
      'pending',
      undefined,
      true,
    );

    try {
      await firstValueFrom(
        this.proposalService.moderate(p.id, {
          status: 'REJECTED',
          rejectionReason: reason,
        }),
      );

      this.notificationService.update(toastId, {
        message: 'Proposal rejected.',
        type: 'success',
        persistent: false,
      });

      await this.load();
      this.closeDetails();
    } catch (e: any) {
      const msg =
        e?.error?.message ||
        e?.message ||
        'Failed to reject proposal.';
      this.notificationService.update(toastId, {
        message: msg,
        type: 'error',
        persistent: false,
      });
      this.actionLoading.set(false);
    }
  }
}
