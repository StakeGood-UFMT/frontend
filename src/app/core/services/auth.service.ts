import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AuthResponse, AuthProfile } from '../models/auth.model';
import { WalletService } from './wallet.service';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectIsLoggedIn, selectProfile, selectAuthState } from '../store/auth/auth.selectors';
import * as AuthActions from '../store/auth/auth.actions';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private wallet = inject(WalletService);
  private store = inject(Store);
  private refreshTokenPromise: Promise<void> | null = null;

  public isLoggedIn = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });
  public profile = toSignal(this.store.select(selectProfile), { initialValue: null as AuthProfile | null });

  constructor() {}

  private mapKycStatus(status: AuthResponse['kyc_status']): AuthProfile['kyc_status'] {
    if (status === 'verified') return 'approved';
    if (status === 'none') return 'not_started';
    return status as any;
  }

  async login(): Promise<void> {
    try {
      // 1. Get Wallet Address
      const walletAddress = await this.wallet.connect();

      // 2. GET Nonce
      const { nonce } = await lastValueFrom(
        this.http.get<{ nonce: string }>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.nonce}`, {
          params: { 
            wallet: walletAddress,
            network: environment.stellar.network
          }
        })
      );

      // 3. Sign Nonce
      const signature = await this.wallet.sign(nonce);

      // 4. POST Verify (Authenticate)
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verify}`, {
          wallet: walletAddress,
          nonce: nonce,
          signature: signature,
          network: environment.stellar.network
        }, {withCredentials: true})
      );

      // 5. Update State via NgRx Action
      this.store.dispatch(AuthActions.loginSuccess({
        // accessToken: response.jwt,
        // refreshToken: response.refresh_token ?? '',
        profile: {
          public_key: response.wallet,
          role: response.user.role,
          kyc_status: this.mapKycStatus(response.kyc_status),
          terms_accepted: true // Default for now
        }
      }));
      
      console.log('[AuthService] Login successful', response.wallet);
    } catch (error) {
      console.error('[AuthService] Login failed', error);
      this.logout();
      throw error;
    }
  }

  async refresh(): Promise<void> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }
    
     this.refreshTokenPromise = (async () => {
    try {
      // body vazio — cookie vai automaticamente
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.refresh}`,
          {},
          { withCredentials: true }
        )
      );

      this.store.dispatch(AuthActions.loginSuccess({
        profile: {
          public_key: response.wallet,
          role: response.user.role,
          kyc_status: this.mapKycStatus(response.kyc_status),
          terms_accepted: true
        }
      }));

    } catch (error) {
      console.error('[AuthService] Token refresh failed', error);
      this.logout();
      throw error;
    } finally {
      this.refreshTokenPromise = null;
    }
  })();

  return this.refreshTokenPromise;
}

logout() {
  // avisa o backend para limpar o cookie
  this.http.post(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.logout}`,
    {},
    { withCredentials: true }
  ).subscribe();

  this.store.dispatch(AuthActions.logout());
  this.wallet.disconnect();
}
}