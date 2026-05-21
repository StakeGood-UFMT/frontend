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
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
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
        this.http.get<any>(`${this.base}${API_CONFIG.endpoints.users.meSettings}`)
      );
      this.settings.set(this.mapSettings(data));
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
      const resp = await lastValueFrom(
        this.http.patch<any>(`${this.base}${API_CONFIG.endpoints.users.mePrivacy}`, payload)
      );
      // Backend returns partial privacy object, update local state
      this.settings.update(s => s ? { 
        ...s, 
        publicVisibility: resp.publicVisibility, 
        privateMode: resp.privateMode 
      } : s);
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

  async mockVerifyKyc(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(
        this.http.post(
          `${this.base}${API_CONFIG.endpoints.users.meKycMockVerify}`,
          {},
        ),
      );
      this.settings.update((s) => (s ? { ...s, kycStatus: 'verified' } : s));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Unable to start mock verification.');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Wallets ──────────────────────────────────────────────────────────────
  async addWallet(address: string): Promise<void> {
    // 1. Obter o desafio (nonce)
    const challenge = await lastValueFrom(
      this.http.post<any>(
        `${this.base}${API_CONFIG.endpoints.users.meWallets}/challenge`,
        { address }
      )
    );

    // 2. Assinar o nonce usando a chave secundária
    const signature = await this.walletService.sign(challenge.nonce, address);

    // 3. Enviar a assinatura para verificação e persistência
    await lastValueFrom(
      this.http.post<any>(
        `${this.base}${API_CONFIG.endpoints.users.meWallets}/verify`,
        {
          address,
          signature,
          nonce: challenge.nonce,
        }
      )
    );

    // 4. Recarregar as configurações atualizadas
    await this.fetchSettings();
  }

  async removeWallet(address: string): Promise<void> {
    if (!this.canRemoveWallet()) {
      throw new Error('You must have at least one linked wallet.');
    }
    const resp = await lastValueFrom(
      this.http.delete<any>(
        `${this.base}${API_CONFIG.endpoints.users.meWalletRemove(address)}`
      )
    );
    // Backend returns { unlinked: true, address, linkedWallets: updated }
    // We update local state by filtering
    this.settings.update(s => {
      if (!s) return null;
      return {
        ...s,
        wallets: s.wallets.filter(w => w.address !== address)
      };
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private mapSettings(data: any): UserSettings {
    return {
      publicVisibility: data.privacy?.publicVisibility ?? false,
      privateMode: data.privacy?.privateMode ?? false,
      twoFactorEnabled: data.security?.totpEnabled ?? false,
      monthlyLimit: data.spending?.spendingLimitUsd ?? 0,
      monthlyConsumed: 0, // Placeholder
      kycStatus: data.profile?.kycStatus ?? 'pending',
      wallets: [
        {
          id: 'primary',
          address: data.wallets.primary,
          isPrimary: true,
          linkedAt: data.profile.createdAt,
        },
        ...(data.wallets.linked || []).map((w: any) => ({
          id: w.address,
          address: w.address,
          isPrimary: false,
          linkedAt: w.linkedAt,
        })),
      ],
    };
  }
}
