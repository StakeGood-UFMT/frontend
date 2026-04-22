import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  
  private http = inject(HttpClient);
  private storage = inject(AuthStorageService);
  private wallet = inject(WalletService);
  private store = inject(Store);

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
        this.http.get<{ nonce: string }>(`${this.baseUrl}/nonce`, {
          params: { wallet: walletAddress }
        })
      );

      // 3. Sign Nonce
      const signature = await this.wallet.sign(nonce);

      // 4. POST Verify (Authenticate)
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/verify`, {
          wallet: walletAddress,
          signature: signature
        })
      );

      // 5. Update State via NgRx Action
      this.store.dispatch(AuthActions.loginSuccess({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        profile: response.profile
      }));
      
      console.log('[AuthService] Login successful', response.profile.public_key);
    } catch (error) {
      console.error('[AuthService] Login failed', error);
      this.logout();
      throw error;
    }
  }

  async refresh(): Promise<string> {
    const currentState = this.storage.load();
    const refreshToken = currentState?.refreshToken;
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    try {
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {
          refresh_token: refreshToken
        })
      );

      this.store.dispatch(AuthActions.loginSuccess({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        profile: response.profile
      }));
      
      return response.access_token;
    } catch (error) {
      console.error('[AuthService] Token refresh failed', error);
      this.logout();
      throw error;
    }
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
    this.wallet.disconnect();
  }
}
