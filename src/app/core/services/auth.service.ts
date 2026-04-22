import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_CONFIG } from '../config/api.config';
import { AuthState, AuthResponse, AuthProfile } from '../models/auth.model';
import { AuthStorageService } from './auth-storage.service';
import { WalletService } from './wallet.service';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectIsLoggedIn, selectProfile, selectAuthState } from '../store/auth/auth.selectors';
import * as AuthActions from '../store/auth/auth.actions';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.base}`;
  
  private http = inject(HttpClient);
  private storage = inject(AuthStorageService);
  private wallet = inject(WalletService);
  private store = inject(Store);
  private refreshTokenPromise: Promise<string> | null = null;

  public isLoggedIn = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });
  public profile = toSignal(this.store.select(selectProfile), { initialValue: null as AuthProfile | null });
  public accessToken = toSignal(this.store.select(selectAuthState).pipe(map(s => s.accessToken)), { initialValue: null as string | null });

  constructor() {}

  async login(): Promise<void> {
    try {
      // 1. Get Wallet Address
      const walletAddress = await this.wallet.connect();

      // 2. GET Nonce
      const { nonce } = await lastValueFrom(
        this.http.get<{ nonce: string }>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.nonce}`, {
          params: { wallet: walletAddress }
        })
      );

      // 3. Sign Nonce
      const signature = await this.wallet.sign(nonce);

      // 4. POST Verify (Authenticate)
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verify}`, {
          wallet: walletAddress,
          nonce: nonce,
          signature: signature
        })
      );

      // 5. Update State via NgRx Action
      this.store.dispatch(AuthActions.loginSuccess({
        accessToken: response.jwt,
        refreshToken: '', // Assuming refresh_token is not in verify response for now
        profile: {
          public_key: response.wallet,
          role: response.user.role,
          kyc_status: response.kyc_status as any,
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

  async refresh(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const currentState = this.storage.load();
    const refreshToken = currentState?.refreshToken;
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await lastValueFrom(
          this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.refresh}`, {
            refresh_token: refreshToken
          })
        );

        this.store.dispatch(AuthActions.loginSuccess({
          accessToken: response.jwt,
          refreshToken: '', 
          profile: {
            public_key: response.wallet,
            role: response.user.role,
            kyc_status: response.kyc_status as any,
            terms_accepted: true
          }
        }));
        
        return response.jwt;
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
    this.store.dispatch(AuthActions.logout());
    this.wallet.disconnect();
  }
}
