import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  UserSettings,
  LinkedWallet,
  PrivacyPayload,
  TwoFactorEnableResponse,
  TwoFactorVerifyPayload,
} from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private readonly base = API_CONFIG.baseUrl;

  // ── State ────────────────────────────────────────────────────────────────
  readonly settings  = signal<UserSettings | null>(null);
  readonly loading   = signal(false);
  readonly error     = signal<string | null>(null);

  // Derived helpers
  readonly wallets        = computed(() => this.settings()?.wallets ?? []);
  readonly canRemoveWallet = computed(() => this.wallets().length > 1);
  readonly twoFactorEnabled = computed(() => this.settings()?.twoFactorEnabled ?? false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  async fetchSettings(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(
        this.http.get<UserSettings>(`${this.base}${API_CONFIG.endpoints.users.meSettings}`)
      );
      this.settings.set(data);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'We could not load your settings. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Privacy ──────────────────────────────────────────────────────────────
  async updatePrivacy(payload: PrivacyPayload): Promise<void> {
    this.loading.set(true);
    try {
      const updated = await lastValueFrom(
        this.http.patch<UserSettings>(`${this.base}${API_CONFIG.endpoints.users.mePrivacy}`, payload)
      );
      this.settings.set(updated);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Unable to update privacy settings.');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────
  async enable2FA(): Promise<TwoFactorEnableResponse> {
    const resp = await lastValueFrom(
      this.http.post<TwoFactorEnableResponse>(
        `${this.base}${API_CONFIG.endpoints.users.me2faEnable}`,
        {}
      )
    );
    return resp;
  }

  async verify2FA(payload: TwoFactorVerifyPayload): Promise<void> {
    await lastValueFrom(
      this.http.post<void>(
        `${this.base}${API_CONFIG.endpoints.users.me2faVerify}`,
        payload
      )
    );
    this.settings.update(s => s ? { ...s, twoFactorEnabled: true } : s);
  }

  // ── Compliance Export ────────────────────────────────────────────────────
  async exportComplianceReport(): Promise<Blob> {
    const blob = await lastValueFrom(
      this.http.post(
        `${this.base}${API_CONFIG.endpoints.users.meComplianceExport}`,
        {},
        { responseType: 'blob' }
      )
    );
    return blob;
  }

  // ── Wallets ──────────────────────────────────────────────────────────────
  async addWallet(address: string): Promise<void> {
    const updated = await lastValueFrom(
      this.http.post<UserSettings>(
        `${this.base}${API_CONFIG.endpoints.users.meWallets}`,
        { address }
      )
    );
    this.settings.set(updated);
  }

  async removeWallet(address: string): Promise<void> {
    if (!this.canRemoveWallet()) {
      throw new Error('You must have at least one linked wallet.');
    }
    const updated = await lastValueFrom(
      this.http.delete<UserSettings>(
        `${this.base}${API_CONFIG.endpoints.users.meWalletRemove(address)}`
      )
    );
    this.settings.set(updated);
  }
}
