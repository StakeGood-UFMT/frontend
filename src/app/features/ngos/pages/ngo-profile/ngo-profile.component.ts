import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgosService } from '../../services/ngos.service';
import { Ngo, TimelineEvent } from '../../../../core/models/ngo.model';
import { TimelineComponent } from '../../components/timeline/timeline.component';

@Component({
  selector: 'app-ngo-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, TimelineComponent],
  template: `
    <div class="profile-page" *ngIf="ngo">
      <!-- Emerald Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="nav-back">
            <a routerLink="/ngos" class="back-btn">← Back to Directory</a>
          </div>
          
          <div class="ngo-header-main">
            <div class="logo-wrapper">
              <img [src]="ngo.logo_url || '/logo.webp'" [alt]="ngo.name" class="profile-logo">
              <div class="verified-indicator" *ngIf="ngo.verified">
                <span class="v-icon">✓</span>
              </div>
            </div>
            <div class="header-text">
              <span class="cause-tag">{{ ngo.cause }}</span>
              <h1 class="ngo-name">{{ ngo.name }}</h1>
              <div class="impact-summary">
                 <span class="impact-val">{{ ngo.total_impact || '0 XLM' }}</span>
                 <span class="impact-lab">Direct Social Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-container">
        <div class="content-layout">
          <!-- Left Column: About + Timeline -->
          <div class="primary-column">
            <section class="about-section">
              <h2 class="section-title">About the Organization</h2>
              <p class="description-text">{{ ngo.description }}</p>
            </section>

            <section class="timeline-section">
              <app-timeline [events]="timeline"></app-timeline>
            </section>
          </div>

          <!-- Right Column: Transparency + Info -->
          <div class="secondary-column">
            <div class="transparency-card">
              <h3 class="card-title">Transparency Hub</h3>
              <p class="card-subtitle">Verified links to audits and on-chain records.</p>
              
              <div class="link-list">
                <a [href]="ngo.audit_url" target="_blank" class="trans-link" *ngIf="ngo.audit_url">
                  <span class="link-icon">📄</span>
                  <div class="link-info">
                    <span class="link-label">Audit Report</span>
                    <span class="link-status">External PDF ↗</span>
                  </div>
                </a>

                <a [href]="ngo.treasury_url" target="_blank" class="trans-link" *ngIf="ngo.treasury_url">
                  <span class="link-icon">🏦</span>
                  <div class="link-info">
                    <span class="link-label">Treasury Address</span>
                    <span class="link-status">On-chain View ↗</span>
                  </div>
                </a>

                <a [href]="ngo.certification_url" target="_blank" class="trans-link" *ngIf="ngo.certification_url">
                  <span class="link-icon">📜</span>
                  <div class="link-info">
                    <span class="link-label">Legal Certification</span>
                    <span class="link-status">Verified Document ↗</span>
                  </div>
                </a>

                <a [href]="ngo.website_url" target="_blank" class="trans-link" *ngIf="ngo.website_url">
                  <span class="link-icon">🌐</span>
                  <div class="link-info">
                    <span class="link-label">Official Website</span>
                    <span class="link-status">{{ ngo.website_url | lowercase }} ↗</span>
                  </div>
                </a>
              </div>
            </div>

            <div class="info-card">
              <h3 class="card-title">Support Impact</h3>
              <p class="card-desc">Help this organization reach their next impact milestone.</p>
              <button class="support-btn" disabled title="Coming soon">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="state-container" *ngIf="loading">
      <div class="spinner"></div>
      <p>Loading organization profile...</p>
    </div>

    <!-- Error State -->
    <div class="state-container" *ngIf="error">
       <div class="error-card">
          <h2>Profile Not Found</h2>
          <p>{{ error }}</p>
          <a routerLink="/ngos" class="back-link">Return to Directory</a>
       </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: #fdfdfd;
    }

    /* ---- Hero Section ---- */
    .hero-section {
      background: linear-gradient(135deg, #064e3b, #065f46);
      padding: 40px 0 80px;
      color: #FFFFFF;
      position: relative;
      overflow: hidden;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: -10%;
      right: -5%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    .nav-back { margin-bottom: 32px; }

    .back-btn {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: color 0.2s;
    }

    .back-btn:hover { color: #FFFFFF; }

    .ngo-header-main {
      display: flex;
      gap: 32px;
      align-items: center;
    }

    .logo-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .profile-logo {
      width: 100%;
      height: 100%;
      border-radius: 24px;
      object-fit: cover;
      background: #FFFFFF;
      border: 4px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .verified-indicator {
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #065f46;
      color: white;
      font-size: 14px;
      font-weight: 900;
    }

    .header-text { flex: 1; }

    .cause-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .ngo-name {
      font-size: 2.75rem;
      font-weight: 800;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }

    .impact-summary {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .impact-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #11D48A;
    }

    .impact-lab {
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
    }

    /* ---- Main Container ---- */
    .main-container {
      max-width: 1200px;
      margin: -40px auto 60px;
      padding: 0 24px;
      position: relative;
      z-index: 2;
    }

    .content-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
    }

    .primary-column {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .secondary-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    section {
      background: #FFFFFF;
      padding: 32px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 16px;
      color: #111815;
    }

    .description-text {
      font-size: 1.05rem;
      line-height: 1.7;
      color: #4b5563;
      margin: 0;
    }

    /* ---- Transparency Card ---- */
    .transparency-card {
      background: #FFFFFF;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0 0 8px;
      color: #111815;
    }

    .card-subtitle {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0 0 20px;
    }

    .link-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .trans-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px;
      background: #f9fafb;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .trans-link:hover {
      background: #FFFFFF;
      border-color: #11D48A;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.1);
    }

    .link-icon {
      font-size: 1.25rem;
      width: 40px;
      height: 40px;
      background: #FFFFFF;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .link-info {
      display: flex;
      flex-direction: column;
    }

    .link-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #111815;
    }

    .link-status {
      font-size: 0.75rem;
      color: #11D48A;
      font-weight: 600;
    }

    .info-card {
      background: linear-gradient(135deg, #11D48A, #065f46);
      padding: 24px;
      border-radius: 20px;
      color: #FFFFFF;
    }

    .support-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: #FFFFFF;
      color: #065f46;
      font-weight: 800;
      margin-top: 16px;
      cursor: not-allowed;
      opacity: 0.9;
    }

    /* ---- Loading & States ---- */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0,0,0,0.05);
      border-top-color: #11D48A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-card {
      text-align: center;
      padding: 48px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }

    .back-link {
      display: inline-block;
      margin-top: 24px;
      color: #11D48A;
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 1024px) {
      .content-layout { grid-template-columns: 1fr; }
      .secondary-column { order: -1; }
      .ngo-name { font-size: 2rem; }
    }

    @media (max-width: 640px) {
      .ngo-header-main { flex-direction: column; text-align: center; gap: 20px; }
      .impact-summary { justify-content: center; }
    }
  `]
})
export class NgoProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private ngosService = inject(NgosService);

  ngo: Ngo | null = null;
  timeline: TimelineEvent[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadNgoData(id);
    }
  }

  async loadNgoData(id: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const [ngo, timeline] = await Promise.all([
        this.ngosService.fetchNgoById(id),
        this.ngosService.fetchNgoTimeline(id)
      ]);
      this.ngo = ngo;
      this.timeline = timeline;
    } catch (err: any) {
      console.error('[NgoProfilePage] Error loading NGO', err);
      this.error = 'Unable to load organization profile. It may not exist or the network is down.';
    } finally {
      this.loading = false;
    }
  }
}
