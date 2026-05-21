import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { WalletService } from '../../../core/services/wallet.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_CONFIG } from '../../../core/config/api.config';

interface AdminUser {
  id: string;
  primaryWallet: string;
  role: string;
  adminJoinedAt?: string | Date;
  createdAt: string | Date;
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-mgmt-container">
      <!-- Header section -->
      <header class="section-header">
        <div class="header-text">
          <h2 class="title">Administrators Directory</h2>
          <p class="subtitle">Grant and revoke administrative access to the on-chain protocol and backend control center.</p>
        </div>
        <div class="stats-badge" *ngIf="!loading()">
          <span class="badge-icon">👥</span>
          <span class="badge-label">Active Admins:</span>
          <span class="badge-count">{{ admins().length }}</span>
        </div>
      </header>

      <!-- Main Layout Grid -->
      <div class="mgmt-grid">
        <!-- Left Column: Add Admin Form -->
        <aside class="mgmt-sidebar">
          <div class="action-card">
            <div class="card-glow"></div>
            <h3 class="card-title">Add Administrator</h3>
            <p class="card-subtitle">Authorize a new Stellar wallet address as an administrator on the smart contract.</p>

            <form (submit)="handleAddAdmin($event)" class="form-layout">
              <div class="input-group">
                <label for="walletAddress" class="input-label">Stellar Wallet Address</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔑</span>
                  <input
                    id="walletAddress"
                    type="text"
                    [(ngModel)]="newAdminWallet"
                    name="newAdminWallet"
                    placeholder="e.g. GCBSLPHR6WH..."
                    required
                    class="form-input"
                    [class.invalid]="newAdminWallet && !isValidStellarAddress(newAdminWallet)"
                  />
                </div>
                <span class="validation-note" *ngIf="newAdminWallet && !isValidStellarAddress(newAdminWallet)">
                  Must be a valid 56-character Stellar public key starting with 'G'.
                </span>
              </div>

              <button
                type="submit"
                [disabled]="busy() || !newAdminWallet || !isValidStellarAddress(newAdminWallet)"
                class="btn-primary"
                [class.loading]="busy() && activeAction() === 'add'"
              >
                <span class="btn-text" *ngIf="!(busy() && activeAction() === 'add')">Add Admin</span>
                <span class="spinner-small" *ngIf="busy() && activeAction() === 'add'"></span>
                <span class="btn-text" *ngIf="busy() && activeAction() === 'add'">Processing...</span>
              </button>
            </form>
          </div>
        </aside>

        <!-- Right Column: Admin List Table -->
        <main class="mgmt-main">
          <div class="table-container">
            <div *ngIf="loading()" class="loading-state">
              <div class="spinner"></div>
              <p>Fetching administrators directory...</p>
            </div>

            <div *ngIf="!loading() && admins().length === 0" class="empty-state">
              <div class="empty-icon">🛡️</div>
              <p class="empty-title">No administrators found</p>
              <p class="empty-subtitle">Database appears to be out of sync. Please check your config.</p>
            </div>

            <table class="data-table" *ngIf="!loading() && admins().length > 0">
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let admin of admins(); trackBy: trackByWallet" [class.self-row]="isSelf(admin.primaryWallet)">
                  <!-- Wallet Address Column -->
                  <td class="wallet-cell">
                    <span class="wallet-short" [title]="admin.primaryWallet">{{ shortenWallet(admin.primaryWallet) }}</span>
                    <button (click)="copyAddress(admin.primaryWallet)" class="btn-copy" title="Copy full address">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <span class="self-tag" *ngIf="isSelf(admin.primaryWallet)">You</span>
                  </td>

                  <!-- Role Badge Column -->
                  <td>
                    <span class="role-badge">
                      <span class="badge-dot"></span>
                      Administrator
                    </span>
                  </td>

                  <!-- Joined Date Column -->
                  <td>
                    <span class="date-cell">
                      {{ formatJoinedDate(admin) }}
                    </span>
                  </td>

                  <!-- Actions Column -->
                  <td>
                    <button
                      *ngIf="!isSelf(admin.primaryWallet)"
                      [disabled]="busy()"
                      (click)="confirmRemove(admin)"
                      class="btn-danger-outline"
                    >
                      Remove
                    </button>
                    <span class="protected-tag" *ngIf="isSelf(admin.primaryWallet)" title="You cannot revoke your own administrative privileges.">
                      Protected
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <!-- Confirmation Overlay Modal -->
      <div class="modal-overlay" *ngIf="showConfirmModal() && adminToRemove()">
        <div class="modal-card">
          <div class="modal-header">
            <span class="warning-icon">⚠️</span>
            <h4 class="modal-title">Revoke Administration Rights</h4>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to remove this administrator?</p>
            <div class="wallet-display">
              <code>{{ adminToRemove()?.primaryWallet }}</code>
            </div>
            <p class="warning-text">This action will invoke the smart contract's <strong>remove_admin</strong> function, requiring your signature to revoke their access on-chain and in the database.</p>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" [disabled]="busy()" (click)="cancelRemove()">Cancel</button>
            <button 
              class="btn-danger" 
              [disabled]="busy()" 
              (click)="handleRemoveAdmin()"
              [class.loading]="busy() && activeAction() === 'remove'"
            >
              <span *ngIf="!(busy() && activeAction() === 'remove')">Revoke Access</span>
              <span class="spinner-small" *ngIf="busy() && activeAction() === 'remove'"></span>
              <span *ngIf="busy() && activeAction() === 'remove'">Processing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .admin-mgmt-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Header */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 8px;
    }

    .title {
      font-family: 'Public Sans', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.9rem;
      color: #64748B;
      margin: 0;
      font-weight: 500;
    }

    .stats-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.15);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #059669;
    }

    .badge-icon {
      font-size: 1rem;
    }

    .badge-count {
      background: #10B981;
      color: white;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }

    /* Grid Layout */
    .mgmt-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 1024px) {
      .mgmt-grid {
        grid-template-columns: 350px 1fr;
      }
    }

    /* Sidebar Action Card */
    .mgmt-sidebar {
      display: flex;
      flex-direction: column;
    }

    .action-card {
      position: relative;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .card-glow {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 6px 0;
      letter-spacing: -0.01em;
    }

    .card-subtitle {
      font-size: 0.82rem;
      color: #64748B;
      margin: 0 0 20px 0;
      line-height: 1.4;
    }

    .form-layout {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 0.95rem;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      padding: 11px 12px 11px 36px;
      border: 1px solid #CBD5E1;
      border-radius: 10px;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      color: #0F172A;
      transition: all 0.2s ease-in-out;
      background: #F8FAFC;
    }

    .form-input:focus {
      outline: none;
      border-color: #10B981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
      background: #FFFFFF;
    }

    .form-input.invalid {
      border-color: #EF4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
    }

    .validation-note {
      font-size: 0.75rem;
      color: #EF4444;
      font-weight: 600;
    }

    /* Buttons */
    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #10B981;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-primary:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:disabled {
      background: #94A3B8;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Main Table Section */
    .mgmt-main {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      min-height: 300px;
      display: flex;
      flex-direction: column;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      background: #F8FAFC;
      padding: 16px 24px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
    }

    .data-table td {
      padding: 16px 24px;
      font-size: 0.85rem;
      color: #334155;
      border-bottom: 1px solid #F1F5F9;
      vertical-align: middle;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .self-row {
      background: rgba(16, 185, 129, 0.02);
    }

    /* Wallet cell */
    .wallet-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .wallet-short {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #0F172A;
    }

    .btn-copy {
      background: none;
      border: none;
      padding: 4px;
      color: #94A3B8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .btn-copy:hover {
      color: #10B981;
      background: rgba(16, 185, 129, 0.08);
    }

    .self-tag {
      background: #10B981;
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      letter-spacing: 0.02em;
    }

    /* Badges */
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(59, 130, 246, 0.08);
      color: #2563EB;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(59, 130, 246, 0.15);
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
    }

    .date-cell {
      color: #64748B;
      font-weight: 500;
    }

    /* Action buttons in table */
    .btn-danger-outline {
      background: transparent;
      border: 1px solid #FECACA;
      color: #EF4444;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: #EF4444;
      color: white;
      border-color: #EF4444;
    }

    .btn-danger-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .protected-tag {
      font-size: 0.8rem;
      color: #94A3B8;
      font-weight: 600;
      font-style: italic;
    }

    /* Modal dialog */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      background: #FFFFFF;
      border-radius: 24px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      max-width: 500px;
      width: calc(100% - 32px);
      padding: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .warning-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .modal-body {
      color: #475569;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .wallet-display {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 10px 14px;
      border-radius: 8px;
      margin: 12px 0;
      overflow-x: auto;
    }

    .wallet-display code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #0F172A;
      white-space: nowrap;
    }

    .warning-text {
      font-size: 0.82rem;
      color: #64748B;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-cancel {
      background: #F1F5F9;
      color: #475569;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #E2E8F0;
    }

    .btn-danger {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #EF4444;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      transition: all 0.15s;
    }

    .btn-danger:hover:not(:disabled) {
      background: #DC2626;
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);
    }

    .btn-danger:disabled {
      background: #CBD5E1;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Feedback & Loaders */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #64748B;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(16, 185, 129, 0.1);
      border-top-color: #10B981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
      opacity: 0.8;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 4px 0;
    }

    .empty-subtitle {
      font-size: 0.82rem;
      color: #64748B;
      margin: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class AdminManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private wallet = inject(WalletService);
  private notify = inject(NotificationService);
  private http = inject(HttpClient);

  admins = signal<AdminUser[]>([]);
  loading = signal(true);
  busy = signal(false);
  activeAction = signal<'add' | 'remove' | null>(null);

  // Form Field
  newAdminWallet = '';

  // Confirmation Modal
  showConfirmModal = signal(false);
  adminToRemove = signal<AdminUser | null>(null);

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.loading.set(true);
    this.adminService.getAdmins().subscribe({
      next: (data) => {
        this.admins.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load administrators:', err);
        this.notify.error('Could not load the administrators list.');
        this.loading.set(false);
      }
    });
  }

  isValidStellarAddress(addr: string): boolean {
    return typeof addr === 'string' && addr.length === 56 && addr.startsWith('G');
  }

  isSelf(wallet: string): boolean {
    const selfKey = this.wallet.publicKey();
    return !!selfKey && selfKey.toUpperCase() === wallet.toUpperCase();
  }

  shortenWallet(addr: string): string {
    if (!addr || addr.length < 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  }

  formatJoinedDate(admin: AdminUser): string {
    const rawDate = admin.adminJoinedAt || admin.createdAt;
    if (!rawDate) return 'Bootstrap';
    try {
      const date = new Date(rawDate);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Bootstrap';
    }
  }

  async copyAddress(addr: string) {
    try {
      await navigator.clipboard.writeText(addr);
      this.notify.success('Address copied to clipboard!');
    } catch (err) {
      this.notify.error('Failed to copy address.');
    }
  }

  trackByWallet(index: number, item: AdminUser): string {
    return item.primaryWallet;
  }

  // --- Add Admin Handler ---
  async handleAddAdmin(event: Event) {
    event.preventDefault();
    const targetWallet = this.newAdminWallet.trim();

    if (!this.isValidStellarAddress(targetWallet)) {
      this.notify.error('Please enter a valid Stellar wallet address.');
      return;
    }

    if (!this.wallet.ensurePublicKey()) {
      this.notify.error('Please connect your administrator wallet.');
      return;
    }

    const alreadyAdmin = this.admins().some(
      (a) => a.primaryWallet.toUpperCase() === targetWallet.toUpperCase()
    );
    if (alreadyAdmin) {
      this.notify.error('This wallet address is already an administrator.');
      return;
    }

    this.busy.set(true);
    this.activeAction.set('add');
    const toastId = this.notify.show('Generating add_admin transaction...', 'pending', undefined, true);

    try {
      // Step 1: Request backend to build & simulate add_admin transaction
      const built = await firstValueFrom(
        this.adminService.buildAddAdminXdr(targetWallet)
      );

      // Step 2: Prompt administrator to sign the transaction via Freighter/Kit
      this.notify.update(toastId, { message: 'Awaiting signature in wallet...' });
      const { signedTxXdr } = await this.wallet.signTransaction(built.xdr);

      // Step 3: Submit signed transaction envelope to backend
      this.notify.update(toastId, { message: 'Broadcasting transaction to Stellar network...' });
      await firstValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.submit}`, {
          signedXdr: signedTxXdr,
          txHash: built.txHash
        })
      );

      // Success
      this.notify.update(toastId, {
        message: 'Administrator added successfully!',
        type: 'success',
        persistent: false
      });

      this.newAdminWallet = '';
      this.loadAdmins();
    } catch (err: any) {
      console.error('Failed to add administrator:', err);
      const errMsg = err?.error?.message || err?.message || 'Transaction failed or rejected.';
      this.notify.update(toastId, {
        message: `Failed: ${errMsg}`,
        type: 'error',
        persistent: false
      });
    } finally {
      this.busy.set(false);
      this.activeAction.set(null);
    }
  }

  // --- Remove Admin Workflows ---
  confirmRemove(admin: AdminUser) {
    if (this.isSelf(admin.primaryWallet)) {
      this.notify.error('You cannot remove yourself.');
      return;
    }
    this.adminToRemove.set(admin);
    this.showConfirmModal.set(true);
  }

  cancelRemove() {
    this.showConfirmModal.set(false);
    this.adminToRemove.set(null);
  }

  async handleRemoveAdmin() {
    const admin = this.adminToRemove();
    if (!admin) return;

    if (!this.wallet.ensurePublicKey()) {
      this.notify.error('Please connect your administrator wallet.');
      return;
    }

    this.busy.set(true);
    this.activeAction.set('remove');
    const toastId = this.notify.show('Generating remove_admin transaction...', 'pending', undefined, true);

    try {
      // Step 1: Request backend to build & simulate remove_admin transaction
      const built = await firstValueFrom(
        this.adminService.buildRemoveAdminXdr(admin.primaryWallet)
      );

      // Step 2: Prompt administrator to sign the transaction via Freighter/Kit
      this.notify.update(toastId, { message: 'Awaiting signature in wallet...' });
      const { signedTxXdr } = await this.wallet.signTransaction(built.xdr);

      // Step 3: Submit signed transaction envelope to backend
      this.notify.update(toastId, { message: 'Revoking administrative rights...' });
      await firstValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.submit}`, {
          signedXdr: signedTxXdr,
          txHash: built.txHash
        })
      );

      // Success
      this.notify.update(toastId, {
        message: 'Administrator removed successfully!',
        type: 'success',
        persistent: false
      });

      this.showConfirmModal.set(false);
      this.adminToRemove.set(null);
      this.loadAdmins();
    } catch (err: any) {
      console.error('Failed to remove administrator:', err);
      const errMsg = err?.error?.message || err?.message || 'Transaction failed or rejected.';
      this.notify.update(toastId, {
        message: `Failed: ${errMsg}`,
        type: 'error',
        persistent: false
      });
    } finally {
      this.busy.set(false);
      this.activeAction.set(null);
    }
  }
}
