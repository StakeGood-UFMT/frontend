import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../../core/services/settings.service';

type TwoFAStep = 'idle' | 'loading-qr' | 'scan' | 'verify' | 'done';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="twofa-card">
      <div class="twofa-header">
        <span class="twofa-icon">🔐</span>
        <div>
          <h3>Two-Factor Authentication</h3>
          <p>Add an extra layer of security with TOTP (e.g., Google Authenticator).</p>
        </div>
        <span class="status-badge" [class.enabled]="isEnabled()">
          {{ isEnabled() ? 'Enabled ✓' : 'Disabled' }}
        </span>
      </div>

      <!-- Already enabled -->
      <div class="already-enabled" *ngIf="isEnabled() && step() === 'idle'">
        <p class="hint">2FA is active on your account. Contact support to disable it.</p>
      </div>

      <!-- Enable CTA -->
      <div class="enable-cta" *ngIf="!isEnabled() && step() === 'idle'">
        <button class="btn-enable" id="btn-enable-2fa" (click)="startEnable()">
          Enable 2FA
        </button>
      </div>

      <!-- Loading QR -->
      <div class="step-loading" *ngIf="step() === 'loading-qr'">
        <div class="spinner"></div>
        <p>Generating QR code…</p>
      </div>

      <!-- Scan QR step -->
      <div class="step-scan" *ngIf="step() === 'scan'">
        <p class="scan-instructions">
          Scan the QR code below with your authenticator app, then enter the 6-digit code to verify.
        </p>
        <div class="qr-container">
          <img [src]="qrCodeUrl()" alt="2FA QR Code" class="qr-img" />
        </div>
        <p class="secret-label">Manual entry key:</p>
        <code class="secret-code">{{ secret() }}</code>
        <button class="btn-next" id="btn-next-2fa-scan" (click)="step.set('verify')">I've scanned it →</button>
      </div>

      <!-- Verify step -->
      <div class="step-verify" *ngIf="step() === 'verify'">
        <p class="verify-instructions">Enter the 6-digit code from your authenticator app:</p>
        <label for="input-2fa-code" class="sr-only">2FA code</label>
        <input
          id="input-2fa-code"
          class="code-input"
          type="text"
          aria-label="Two-factor authentication code"
          maxlength="6"
          placeholder="000000"
          [(ngModel)]="verifyCode"
          [ngModelOptions]="{standalone: true}"
          inputmode="numeric"
          pattern="[0-9]*" />
        <div class="verify-error" *ngIf="verifyError()">{{ verifyError() }}</div>
        <div class="verify-actions">
          <button
            class="btn-verify"
            id="btn-verify-2fa"
            [disabled]="verifyCode.length !== 6 || verifying()"
            (click)="submitVerify()">
            {{ verifying() ? 'Verifying…' : 'Verify & Activate' }}
          </button>
          <button class="btn-back" id="btn-back-2fa" (click)="step.set('scan')">← Back</button>
        </div>
      </div>

      <!-- Done step -->
      <div class="step-done" *ngIf="step() === 'done'">
        <div class="done-icon">✅</div>
        <p>2FA successfully enabled! Your account is now more secure.</p>
      </div>
    </div>
  `,
  styles: [`
    .twofa-card {
      background: #0F172A;
      border-radius: 20px;
      padding: 1.75rem 2rem;
      color: white;
    }
    .twofa-header {
      display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;
    }
    .twofa-icon { font-size: 1.75rem; flex-shrink: 0; }
    .twofa-header h3 { margin: 0 0 0.2rem; font-size: 1rem; font-weight: 800; }
    .twofa-header p  { margin: 0; font-size: 0.82rem; color: #94A3B8; }
    .status-badge {
      margin-left: auto; flex-shrink: 0;
      background: #1E293B; color: #64748B;
      border-radius: 99px; font-size: 0.75rem; font-weight: 700;
      padding: 0.25rem 0.85rem;
    }
    .status-badge.enabled { background: #064E3B; color: #34D399; }

    .hint { font-size: 0.82rem; color: #94A3B8; margin: 0; }
    .already-enabled { padding: 0.5rem 0; }

    .btn-enable {
      background: linear-gradient(135deg, #11D48A, #0fb87a);
      color: #0F172A; border: none; border-radius: 10px;
      padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.9rem;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-enable:hover { opacity: 0.88; }

    .step-loading { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1rem 0; }
    .spinner {
      width: 28px; height: 28px; border: 3px solid #1E293B;
      border-top-color: #11D48A; border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .step-loading p { color: #94A3B8; font-size: 0.85rem; margin: 0; }

    .scan-instructions { font-size: 0.85rem; color: #94A3B8; margin: 0 0 1.25rem; }
    .qr-container {
      background: white; border-radius: 12px; width: 180px; height: 180px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
      padding: 8px;
    }
    .qr-img { width: 100%; height: 100%; object-fit: contain; }
    .secret-label { font-size: 0.75rem; color: #64748B; margin: 0 0 0.3rem; text-align: center; }
    .secret-code {
      display: block; background: #1E293B; padding: 0.6rem 1rem; border-radius: 8px;
      font-size: 0.8rem; letter-spacing: 0.1em; text-align: center;
      color: #7DD3FC; margin-bottom: 1.25rem; word-break: break-all;
    }
    .btn-next {
      width: 100%; background: #1E293B; color: #7DD3FC; border: 1px solid #334155;
      border-radius: 10px; padding: 0.65rem; font-weight: 700; font-size: 0.9rem;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-next:hover { background: #263041; }

    .verify-instructions { font-size: 0.85rem; color: #94A3B8; margin: 0 0 1rem; }
    .code-input {
      width: 100%; text-align: center; font-size: 2rem; font-weight: 800;
      letter-spacing: 0.4em; padding: 0.75rem; border: 2px solid #334155;
      border-radius: 12px; background: #1E293B; color: white;
      outline: none; box-sizing: border-box; margin-bottom: 0.75rem;
    }
    .code-input:focus { border-color: #11D48A; }
    .verify-error { color: #F87171; font-size: 0.82rem; margin-bottom: 0.75rem; }
    .verify-actions { display: flex; flex-direction: column; gap: 0.6rem; }
    .btn-verify {
      background: linear-gradient(135deg, #11D48A, #0fb87a); color: #0F172A;
      border: none; border-radius: 10px; padding: 0.7rem;
      font-weight: 800; font-size: 0.9rem; cursor: pointer;
    }
    .btn-verify:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-back {
      background: #1E293B; color: #64748B; border: 1px solid #334155;
      border-radius: 10px; padding: 0.6rem; font-size: 0.85rem;
      font-weight: 600; cursor: pointer;
    }

    .step-done { text-align: center; padding: 1rem 0; }
    .done-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .step-done p { color: #34D399; font-weight: 600; font-size: 0.95rem; }
  `]
})
export class TwoFactorSetupComponent implements OnInit {
  private svc = inject(SettingsService);

  isEnabled = this.svc.twoFactorEnabled;

  step       = signal<TwoFAStep>('idle');
  qrCodeUrl  = signal('');
  secret     = signal('');
  verifyCode = '';
  verifying  = signal(false);
  verifyError = signal<string | null>(null);

  ngOnInit() {}

  async startEnable() {
    this.step.set('loading-qr');
    try {
      const resp = await this.svc.enable2FA();
      this.qrCodeUrl.set(resp.qrCodeUrl);
      this.secret.set(resp.secret);
      this.step.set('scan');
    } catch {
      this.step.set('idle');
    }
  }

  async submitVerify() {
    if (this.verifyCode.length !== 6) return;
    this.verifying.set(true);
    this.verifyError.set(null);
    try {
      await this.svc.verify2FA({ code: this.verifyCode });
      this.step.set('done');
    } catch (e: any) {
      this.verifyError.set(e?.error?.message ?? 'Invalid code. Please try again.');
    } finally {
      this.verifying.set(false);
    }
  }
}
