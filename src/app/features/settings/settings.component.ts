import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { PrivacyToggleComponent } from './components/privacy-toggle/privacy-toggle.component';
import { LinkedWalletsComponent } from './components/linked-wallets/linked-wallets.component';
import { TwoFactorSetupComponent } from './components/two-factor-setup/two-factor-setup.component';
import { ComplianceReportExportComponent } from './components/compliance-report-export/compliance-report-export.component';

type SettingsTab = 'privacy' | 'wallets' | 'security' | 'compliance';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrivacyToggleComponent,
    LinkedWalletsComponent,
    TwoFactorSetupComponent,
    ComplianceReportExportComponent,
  ],
  template: `
    <div class="settings-page">

      <!-- ── Page Header ───────────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-content">
          <h1>Account Settings</h1>
          <p class="header-sub">
            Manage your privacy, linked wallets, security and compliance.
          </p>
        </div>
        <div class="header-badge">
          <span>⚙️</span>
        </div>
      </div>

      <!-- ── Monthly Limit Banner ──────────────────────────────────────── -->
      <div class="limit-banner" *ngIf="settings()">
        <div class="limit-info">
          <span class="limit-label">Monthly Limit</span>
          <span class="limit-values">
            <strong>{{ settings()!.monthlyConsumed | number }}</strong>
            / {{ settings()!.monthlyLimit | number }} XLM
          </span>
        </div>
        <div class="limit-bar-wrap">
          <div class="limit-bar" role="progressbar" aria-label="Monthly usage" [attr.aria-valuemin]="0" [attr.aria-valuemax]="100" [attr.aria-valuenow]="limitPercent()">
            <div
              class="limit-fill"
              [style.width]="limitPercent() + '%'"
              [class.danger]="limitPercent() >= 90">
            </div>
          </div>
          <span class="limit-pct">{{ limitPercent() | number:'1.0-0' }}% used</span>
        </div>
      </div>

      <!-- ── Tab Navigation ────────────────────────────────────────────── -->
      <div class="tabs">
        <button
          *ngFor="let tab of tabs"
          [id]="'tab-' + tab.id"
          class="tab-btn"
          [class.active]="activeTab() === tab.id"
          (click)="activeTab.set(tab.id)">
          <span>{{ tab.icon }}</span> {{ tab.label }}
        </button>
      </div>

      <!-- ── Loading State ─────────────────────────────────────────────── -->
      <div class="loading-state" *ngIf="loading() && !settings()">
        <div class="spinner"></div>
        <p>Loading your settings…</p>
      </div>

      <!-- ── Error State ───────────────────────────────────────────────── -->
      <div class="error-banner" *ngIf="svcError() && !settings()" role="alert" aria-live="assertive">
        <span aria-hidden="true">⚠️</span>
        <span>{{ svcError() }}</span>
        <button (click)="reload()" class="retry-btn">Retry</button>
      </div>

      <!-- ── Tab Panels ────────────────────────────────────────────────── -->
      <div class="panel" *ngIf="settings()">

        <!-- PRIVACY -->
        <section *ngIf="activeTab() === 'privacy'" class="section-privacy" aria-label="Privacy settings">
          <div class="section-intro">
            <h2>Privacy Controls</h2>
            <p>Choose how you appear to other users and how your data is shared.</p>
          </div>
          <div class="toggles-grid">
            <app-privacy-toggle
              title="Public Visibility"
              description="Your profile and portfolio appear in leaderboards and public listings."
              icon="👁️"
              toggleId="public-visibility"
              [value]="settings()!.publicVisibility"
              [disabled]="loading()"
              hint="Disabling hides you from leaderboards but keeps your stakes active."
              (toggled)="onPrivacyToggle('publicVisibility', $event)">
            </app-privacy-toggle>

            <app-privacy-toggle
              title="Private Mode"
              description="Your stakes, amounts and positions are hidden from other users."
              icon="🕵️"
              toggleId="private-mode"
              [value]="settings()!.privateMode"
              [disabled]="loading()"
              hint="In private mode you still appear on leaderboard positions without amounts."
              (toggled)="onPrivacyToggle('privateMode', $event)">
            </app-privacy-toggle>
          </div>

          <div class="save-row" *ngIf="privacyDirty()">
            <button class="btn-save" id="btn-save-privacy" [disabled]="loading()" (click)="savePrivacy()">
              {{ loading() ? 'Saving…' : 'Save Changes' }}
            </button>
            <button class="btn-discard" id="btn-discard-privacy" (click)="discardPrivacy()">Discard</button>
          </div>

          <div class="saved-toast" *ngIf="savedToast()" role="status" aria-live="polite">✅ Privacy settings saved!</div>
        </section>

        <!-- WALLETS -->
        <section *ngIf="activeTab() === 'wallets'" aria-label="Linked wallets">
          <app-linked-wallets
            [wallets]="settings()!.wallets"
            [canRemove]="canRemoveWallet()"
            (addWallet)="onAddWallet($event)"
            (removeWallet)="onRemoveWallet($event)">
          </app-linked-wallets>
          <div class="wallet-error" *ngIf="walletError()" role="alert" aria-live="assertive">
            ❌ {{ walletError() }}
          </div>
        </section>

        <!-- SECURITY / 2FA -->
        <section *ngIf="activeTab() === 'security'" aria-label="Security settings">
          <div class="section-intro">
            <h2>Security</h2>
            <p>Protect your account with two-factor authentication.</p>
          </div>
          <app-two-factor-setup></app-two-factor-setup>
        </section>

        <!-- COMPLIANCE -->
        <section *ngIf="activeTab() === 'compliance'" aria-label="Compliance and reporting">
          <div class="section-intro">
            <h2>Compliance & Reports</h2>
            <p>Generate and download your compliance documentation.</p>
          </div>
          <app-compliance-report-export></app-compliance-report-export>
        </section>

      </div>
    </div>
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────────────────── */
    .settings-page {
      max-width: 760px;
      margin: 0 auto;
      padding: 1rem 0 3rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ─────────────────────────────────────────────────────── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.3rem;
      letter-spacing: -0.03em;
    }
    .header-sub {
      color: #6B7280;
      font-size: 0.95rem;
      margin: 0;
    }
    .header-badge {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #11D48A22, #11D48A44);
      border: 1px solid #11D48A55;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    /* ── Monthly Limit Banner ────────────────────────────────────────── */
    .limit-banner {
      background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
      border: 1px solid #D1FAE5;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .limit-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .limit-label { font-size: 0.82rem; color: #059669; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .limit-values { font-size: 0.95rem; color: #111827; }
    .limit-values strong { font-size: 1.1rem; font-weight: 800; }
    .limit-bar-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .limit-bar {
      flex: 1; height: 8px; background: #D1FAE5; border-radius: 99px; overflow: hidden;
    }
    .limit-fill {
      height: 100%;
      background: linear-gradient(90deg, #11D48A, #059669);
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .limit-fill.danger { background: linear-gradient(90deg, #F59E0B, #EF4444); }
    .limit-pct { font-size: 0.78rem; color: #6B7280; white-space: nowrap; }

    /* ── Tabs ────────────────────────────────────────────────────────── */
    .tabs {
      display: flex;
      gap: 0.5rem;
      background: #F3F4F6;
      border-radius: 14px;
      padding: 0.4rem;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      border-radius: 10px;
      padding: 0.6rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .tab-btn.active {
      background: white;
      color: #111827;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .tab-btn:hover:not(.active) { color: #374151; background: rgba(255,255,255,0.6); }

    /* ── Panels ──────────────────────────────────────────────────────── */
    .panel {
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .section-intro { margin-bottom: 1.25rem; }
    .section-intro h2 { font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0 0 0.3rem; }
    .section-intro p  { font-size: 0.875rem; color: #6B7280; margin: 0; }

    .toggles-grid { display: flex; flex-direction: column; gap: 1rem; }

    /* Save row */
    .save-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .btn-save {
      background: linear-gradient(135deg, #11D48A, #0fb87a);
      color: white; border: none; border-radius: 10px;
      padding: 0.65rem 1.75rem; font-weight: 700; font-size: 0.9rem;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-save:hover:not(:disabled) { opacity: 0.88; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-discard {
      background: #F3F4F6; color: #374151; border: none; border-radius: 10px;
      padding: 0.65rem 1.25rem; font-weight: 600; font-size: 0.9rem; cursor: pointer;
    }

    .saved-toast {
      margin-top: 0.75rem; font-size: 0.88rem; color: #059669;
      font-weight: 600; animation: fadeIn 0.3s ease;
    }

    /* wallet error */
    .wallet-error {
      margin-top: 0.75rem; font-size: 0.85rem; color: #DC2626; font-weight: 600;
    }

    /* Loading */
    .loading-state {
      display: flex; flex-direction: column; align-items: center; padding: 4rem;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #F3F4F6;
      border-top-color: #11D48A; border-radius: 50%;
      animation: spin 1s linear infinite; margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: #9CA3AF; font-size: 0.9rem; }

    .error-banner {
      background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px;
      padding: 1rem 1.25rem; color: #DC2626; font-size: 0.9rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .retry-btn {
      margin-left: auto; background: #DC2626; color: white; border: none;
      border-radius: 8px; padding: 0.4rem 0.9rem; font-size: 0.82rem;
      font-weight: 700; cursor: pointer;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .settings-page { padding: 0.5rem 0 2rem; }
      .page-header h1 { font-size: 1.5rem; }
    }
  `]
})
export class SettingsPage implements OnInit {
  private svc = inject(SettingsService);

  settings      = this.svc.settings;
  loading       = this.svc.loading;
  svcError      = this.svc.error;
  canRemoveWallet = this.svc.canRemoveWallet;

  activeTab = signal<SettingsTab>('privacy');

  // Local privacy draft
  privacyDraft = signal<{ publicVisibility: boolean; privateMode: boolean } | null>(null);
  privacyDirty = computed(() => {
    const d = this.privacyDraft();
    const s = this.settings();
    if (!d || !s) return false;
    return d.publicVisibility !== s.publicVisibility || d.privateMode !== s.privateMode;
  });

  savedToast = signal(false);
  walletError = signal<string | null>(null);

  limitPercent = computed(() => {
    const s = this.settings();
    if (!s || s.monthlyLimit === 0) return 0;
    return Math.min(100, (s.monthlyConsumed / s.monthlyLimit) * 100);
  });

  tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'privacy',    label: 'Privacy',    icon: '🛡️' },
    { id: 'wallets',    label: 'Wallets',    icon: '💳' },
    { id: 'security',   label: 'Security',   icon: '🔐' },
    { id: 'compliance', label: 'Compliance', icon: '📋' },
  ];

  async ngOnInit() {
    await this.svc.fetchSettings();
  }

  async reload() {
    await this.svc.fetchSettings();
  }

  onPrivacyToggle(key: 'publicVisibility' | 'privateMode', val: boolean) {
    const base = this.privacyDraft() ?? {
      publicVisibility: this.settings()?.publicVisibility ?? false,
      privateMode:      this.settings()?.privateMode ?? false,
    };
    this.privacyDraft.set({ ...base, [key]: val });
  }

  async savePrivacy() {
    const draft = this.privacyDraft();
    if (!draft) return;
    await this.svc.updatePrivacy(draft);
    this.privacyDraft.set(null);
    this.savedToast.set(true);
    setTimeout(() => this.savedToast.set(false), 3000);
  }

  discardPrivacy() {
    this.privacyDraft.set(null);
  }

  async onAddWallet(address: string) {
    this.walletError.set(null);
    try {
      await this.svc.addWallet(address);
    } catch (e: any) {
      this.walletError.set(e?.error?.message ?? 'Failed to add wallet');
    }
  }

  async onRemoveWallet(address: string) {
    this.walletError.set(null);
    try {
      await this.svc.removeWallet(address);
    } catch (e: any) {
      this.walletError.set(e?.error?.message ?? 'Failed to remove wallet');
    }
  }
}
