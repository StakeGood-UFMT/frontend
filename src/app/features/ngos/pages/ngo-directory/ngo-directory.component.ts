import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgosService } from '../../services/ngos.service';
import { NgoCardComponent } from '../../components/ngo-card/ngo-card.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-ngo-directory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgoCardComponent],
  template: `
    <div class="ngo-page" id="ngo-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">🌍</span>
            NGO Directory
          </h1>
          <p class="page-subtitle">
            Discover verified non-profit organizations and track their real-world impact through blockchain transparency.
          </p>
        </div>
        <div class="header-stats" *ngIf="!ngosService.loading() && !ngosService.error()">
          <div class="stat-chip">
            <span class="stat-value">{{ ngosService.filteredNgos().length }}</span>
            <span class="stat-label">Organizations</span>
          </div>
          <button class="propose-btn" (click)="openProposal()">Propose NGO</button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-container">
        <!-- Search -->
        <div class="search-wrapper">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search by name, description or cause..."
            class="search-input"
            id="ngo-search-input"
          />
          <button
            *ngIf="searchControl.value"
            (click)="clearSearch()"
            class="clear-btn"
          >✕</button>
        </div>

        <div class="filter-actions">
          <!-- Cause Filter -->
          <div class="tabs-scroll" #tabsScroll>
            <div class="tabs">
              <button
                *ngFor="let cause of causes"
                (click)="setCause(cause.value)"
                [class.active]="ngosService.filters().cause === cause.value"
                class="tab-btn"
              >
                {{ cause.label }}
              </button>
            </div>
          </div>

          <!-- Sort Filter -->
          <div class="sort-wrapper">
             <select [formControl]="sortControl" class="sort-select">
                <option value="trending">Trending</option>
                <option value="newest">Newest First</option>
             </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="state-container" *ngIf="ngosService.loading()">
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let _ of [1,2,3,4,5,6]">
            <div class="skel-header">
              <div class="skel-avatar"></div>
              <div class="skel-info">
                <div class="skel-line"></div>
                <div class="skel-badges"></div>
              </div>
            </div>
            <div class="skel-body"></div>
            <div class="skel-footer"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="state-container" *ngIf="ngosService.error() && !ngosService.loading()">
        <div class="state-card error-state">
          <div class="state-icon">⚠️</div>
          <h2 class="state-title">Something went wrong</h2>
          <p class="state-message">{{ ngosService.error() }}</p>
          <button class="retry-btn" (click)="retry()">
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="state-container" *ngIf="ngosService.isEmpty() && !ngosService.loading()">
        <div class="state-card empty-state">
          <div class="state-icon">🔍</div>
          <h2 class="state-title">No NGOs found</h2>
          <p class="state-message">Try adjusting your filters or submit a new NGO proposal.</p>
          <button class="clear-filters-btn" (click)="clearFilters()">
            Clear All Filters
          </button>
          <button class="propose-empty-btn" (click)="openProposal()">Propose NGO</button>
        </div>
      </div>

      <!-- NGO Grid -->
      <div
        class="ngo-grid"
        *ngIf="!ngosService.loading() && !ngosService.error() && !ngosService.isEmpty()"
      >
        <app-ngo-card
          *ngFor="let ngo of ngosService.filteredNgos(); trackBy: trackById"
          [ngo]="ngo"
          class="grid-item"
        ></app-ngo-card>
      </div>

      <div *ngIf="proposalOpen()" class="modal-overlay" (click)="closeProposal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="modal-title">
              <h3>Propose an NGO</h3>
              <p>Submit details for review. Admin approval registers the NGO on-chain.</p>
            </div>
            <div class="modal-header-actions">
              <button type="button" class="action-icon-btn" (click)="copyExampleJson()" title="Copy JSON Template">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                Template
              </button>
              <button type="button" class="action-icon-btn" (click)="pasteJsonFromClipboard()" title="Paste JSON from Clipboard">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M11 14h2"></path><path d="M12 11v6"></path></svg>
                Paste
              </button>
              <button class="close-btn" (click)="closeProposal()">✕</button>
            </div>
          </header>

          <form class="modal-body" [formGroup]="proposalForm" (ngSubmit)="submitProposal()">
            <div class="form-grid">
              <label class="field">
                <span class="label">Name</span>
                <input class="input" formControlName="name" placeholder="Organization name" />
              </label>

              <label class="field">
                <span class="label">Cause</span>
                <input class="input" formControlName="category" placeholder="e.g. Environment, Education" />
              </label>

              <label class="field full">
                <span class="label">Description</span>
                <textarea class="textarea" formControlName="description" rows="4" placeholder="What does this organization do?"></textarea>
              </label>

              <label class="field">
                <span class="label">Treasury Wallet (Stellar)</span>
                <input class="input" formControlName="walletAddress" placeholder="G..." />
              </label>

              <label class="field">
                <span class="label">Website</span>
                <input class="input" formControlName="website" placeholder="https://..." />
              </label>

              <label class="field">
                <span class="label">Logo URL</span>
                <input class="input" formControlName="logoUrl" placeholder="https://..." />
              </label>

              <label class="field">
                <span class="label">Audit URL</span>
                <input class="input" formControlName="auditUrl" placeholder="https://..." />
              </label>

              <label class="field">
                <span class="label">Treasury Explorer URL</span>
                <input class="input" formControlName="treasuryUrl" placeholder="https://..." />
              </label>

              <label class="field">
                <span class="label">Certification URL</span>
                <input class="input" formControlName="certificationUrl" placeholder="https://..." />
              </label>
            </div>

            <div class="error-text" *ngIf="proposalError()">{{ proposalError() }}</div>

            <div class="modal-actions">
              <button type="button" class="secondary-btn" (click)="closeProposal()" [disabled]="proposalSubmitting()">Cancel</button>
              <button type="submit" class="primary-btn" [disabled]="proposalSubmitting()">
                {{ proposalSubmitting() ? 'Submitting...' : 'Submit' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ngo-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.4s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ---- Page Header ---- */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-icon { font-size: 1.5rem; }

    .page-subtitle {
      margin: 6px 0 0;
      font-size: 0.92rem;
      color: #6b7280;
      line-height: 1.5;
      max-width: 600px;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(17, 212, 138, 0.08);
      border: 1.5px solid rgba(17, 212, 138, 0.15);
      border-radius: 12px;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #11D48A;
    }

    .stat-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .propose-btn {
      border: none;
      background: #11D48A;
      color: #0b1220;
      font-weight: 900;
      padding: 10px 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .propose-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(17, 212, 138, 0.18);
    }

    .propose-empty-btn {
      margin-top: 10px;
      background: #11D48A;
      border: none;
      color: #0b1220;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 900;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .propose-empty-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(17, 212, 138, 0.18);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 50;
    }

    .modal {
      width: 100%;
      max-width: 720px;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 18px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .modal-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 900;
      color: #111815;
    }

    .modal-title p {
      margin: 6px 0 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .modal-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-icon-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid rgba(0, 0, 0, 0.08);
      background: #f8fafc;
      font-size: 0.75rem;
      font-weight: 800;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-icon-btn:hover {
      background: #f1f5f9;
      color: #11D48A;
      border-color: rgba(17, 212, 138, 0.3);
    }

    .close-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.05rem;
      color: #6b7280;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background-color: #f1f5f9;
      color: #ef4444;
    }

    .modal-body {
      padding: 16px 18px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field.full {
      grid-column: 1 / -1;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .input,
    .textarea {
      border: 2px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      padding: 12px 12px;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input:focus,
    .textarea:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 4px rgba(17, 212, 138, 0.12);
    }

    .error-text {
      color: #b91c1c;
      background: rgba(185, 28, 28, 0.08);
      border: 1px solid rgba(185, 28, 28, 0.15);
      padding: 10px 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .secondary-btn {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 12px;
      padding: 10px 14px;
      font-weight: 900;
      cursor: pointer;
      color: #6b7280;
    }

    .primary-btn {
      background: #11D48A;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-weight: 900;
      cursor: pointer;
      color: #0b1220;
    }

    @media (max-width: 720px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ---- Filters ---- */
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #9ca3af;
      display: flex;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 14px 48px;
      font-size: 0.95rem;
      border: 2px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      background: #FFFFFF;
      outline: none;
      transition: all 0.3s;
    }

    .search-input:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 4px rgba(17, 212, 138, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 14px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 0.7rem;
      color: #6b7280;
    }

    .filter-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .tabs-scroll {
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tabs-scroll::-webkit-scrollbar { display: none; }

    .tabs {
      display: flex;
      gap: 8px;
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      background: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      border-color: rgba(17, 212, 138, 0.3);
      color: #11D48A;
    }

    .tab-btn.active {
      background: rgba(17, 212, 138, 0.08);
      border-color: #11D48A;
      color: #11D48A;
    }

    .sort-select {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      background: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 600;
      color: #111815;
      outline: none;
      cursor: pointer;
    }

    /* ---- Grid ---- */
    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
    }

    /* ---- States ---- */
    .state-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    .state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 32px;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      max-width: 420px;
      width: 100%;
    }

    .state-icon { font-size: 3rem; margin-bottom: 16px; }
    .state-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; }
    .state-message { font-size: 0.9rem; color: #6b7280; margin-bottom: 24px; }

    .retry-btn, .clear-filters-btn {
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }

    .retry-btn {
      background: #11D48A;
      color: #FFFFFF;
      border: none;
    }

    .clear-filters-btn {
      background: transparent;
      border: 2px solid rgba(17, 212, 138, 0.3);
      color: #11D48A;
    }

    /* ---- Skeleton ---- */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      width: 100%;
    }

    .skeleton-card {
      height: 240px;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .skel-avatar { width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6; }
    .skel-line { width: 60%; height: 20px; background: #f3f4f6; border-radius: 4px; margin-top: 12px; }
    .skel-body { width: 100%; height: 60px; background: #f3f4f6; border-radius: 4px; margin-top: 24px; }

    @media (max-width: 768px) {
      .filter-actions { flex-direction: column; align-items: flex-start; }
      .sort-wrapper { width: 100%; }
      .sort-select { width: 100%; }
      .ngo-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class NgoDirectoryPage implements OnInit, OnDestroy {
  public ngosService = inject(NgosService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  searchControl = new FormControl('', { nonNullable: true });
  sortControl = new FormControl<'newest' | 'trending'>('trending', { nonNullable: true });

  protected proposalOpen = signal(false);
  protected proposalSubmitting = signal(false);
  protected proposalError = signal<string | null>(null);

  protected proposalForm = this.fb.group({
    name: ['', Validators.required],
    category: [''],
    description: [''],
    walletAddress: ['', Validators.required],
    website: [''],
    logoUrl: [''],
    auditUrl: [''],
    treasuryUrl: [''],
    certificationUrl: [''],
  });

  causes = [
    { value: 'ALL', label: 'All Causes' },
    { value: 'Education', label: 'Education' },
    { value: 'Health', label: 'Health' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Animals', label: 'Animals' },
    { value: 'Human Rights', label: 'Human Rights' },
    { value: 'Poverty', label: 'Poverty' }
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.ngosService.fetchNgos();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.ngosService.setSearch(value);
    });

    this.sortControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.ngosService.setSortBy(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openProposal(): void {
    this.proposalError.set(null);
    this.proposalOpen.set(true);
  }

  closeProposal(): void {
    this.proposalSubmitting.set(false);
    this.proposalError.set(null);
    this.proposalOpen.set(false);
  }

  async submitProposal(): Promise<void> {
    this.proposalError.set(null);
    if (this.proposalForm.invalid) {
      this.proposalForm.markAllAsTouched();
      this.proposalError.set('Please fill the required fields.');
      return;
    }

    this.proposalSubmitting.set(true);
    try {
      const v = this.proposalForm.getRawValue();
      await this.ngosService.submitNgoProposal({
        name: v.name || '',
        description: v.description || undefined,
        category: v.category || undefined,
        walletAddress: v.walletAddress || '',
        website: v.website || undefined,
        logoUrl: v.logoUrl || undefined,
        auditUrl: v.auditUrl || undefined,
        treasuryUrl: v.treasuryUrl || undefined,
        certificationUrl: v.certificationUrl || undefined,
      });
      this.notifications.success('NGO proposal submitted for review.');
      this.proposalSubmitting.set(false);
      this.closeProposal();
    } catch (e: any) {
      const msg =
        e?.error?.message ||
        e?.message ||
        'Failed to submit NGO proposal.';
      this.proposalError.set(msg);
      this.proposalSubmitting.set(false);
    }
  }

  setCause(cause: string): void {
    this.ngosService.setCause(cause);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.sortControl.setValue('trending');
    this.ngosService.clearFilters();
  }

  retry(): void {
    this.ngosService.fetchNgos();
  }

  get exampleNgoJson(): string {
    const example = {
      name: 'Global Relief Foundation',
      category: 'Humanitarian Aid',
      description: 'Providing emergency medical assistance and food security to disaster-stricken regions worldwide.',
      walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH',
      website: 'https://globalrelief.org',
      logoUrl: 'https://globalrelief.org/logo.png',
      auditUrl: 'https://globalrelief.org/audit2023.pdf',
      treasuryUrl: 'https://stellar.expert/explorer/public/account/GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH',
      certificationUrl: 'https://globalrelief.org/certification.pdf'
    };
    return JSON.stringify(example, null, 2);
  }

  async copyExampleJson() {
    try {
      const text = this.exampleNgoJson;
      const nav = (globalThis as any).navigator as Navigator | undefined;

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.notifications.success('JSON template copied to clipboard.');
    } catch {
      this.notifications.error('Could not copy JSON. Please try manually.');
    }
  }

  async pasteJsonFromClipboard() {
    try {
      const nav = (globalThis as any).navigator as Navigator | undefined;
      const text = await nav?.clipboard?.readText?.();
      
      if (!text) {
        this.notifications.error('Clipboard is empty or access was denied.');
        return;
      }

      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      this.proposalForm.patchValue({
        name: parsed.name || '',
        category: parsed.category || '',
        description: parsed.description || '',
        walletAddress: parsed.walletAddress || parsed.wallet_address || '',
        website: parsed.website || '',
        logoUrl: parsed.logoUrl || parsed.logo_url || '',
        auditUrl: parsed.auditUrl || parsed.audit_url || '',
        treasuryUrl: parsed.treasuryUrl || parsed.treasury_url || '',
        certificationUrl: parsed.certificationUrl || parsed.certification_url || '',
      });

      this.proposalForm.markAllAsTouched();
      this.notifications.success('Form filled from clipboard JSON.');
    } catch (e) {
      console.error('[NgoDirectoryPage] Failed to paste/parse JSON:', e);
      this.notifications.error('Could not parse JSON from clipboard. Make sure it follows the correct format.');
    }
  }

  trackById(_: number, ngo: any): string {
    return ngo.id;
  }
}
