import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState, AuthResponse, AuthProfile } from '../models/auth.model';
import { AuthStorageService } from './auth-storage.service';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  
  private state = signal<AuthState>({
    accessToken: null,
    refreshToken: null,
    profile: null,
    isLoggedIn: false
  });

  public isLoggedIn = computed(() => this.state().isLoggedIn);
  public profile = computed(() => this.state().profile);
  public accessToken = computed(() => this.state().accessToken);

  constructor(
    private http: HttpClient,
    private storage: AuthStorageService,
    private wallet: WalletService
  ) {
    this.init();
  }

  private init() {
    const saved = this.storage.load();
    if (saved) {
      this.state.set(saved);
    }
  }

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
      // Note: The backend usually expects the signature of the nonce string.
      // Depending on the implementation, we might need to sign a transaction or a blob.
      const signature = await this.wallet.sign(nonce);

      // 4. POST Verify (Authenticate)
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/verify`, {
          wallet: walletAddress,
          signature: signature
        })
      );

      // 5. Update State and Storage
      const newState: AuthState = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        profile: response.profile,
        isLoggedIn: true
      };
      
      this.state.set(newState);
      this.storage.save(newState);
      
      console.log('[AuthService] Login successful', response.profile.public_key);
    } catch (error) {
      console.error('[AuthService] Login failed', error);
      this.logout();
      throw error;
    }
  }

  async refresh(): Promise<string> {
    const refreshToken = this.state().refreshToken;
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

      const newState: AuthState = {
        ...this.state(),
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        profile: response.profile
      };

      this.state.set(newState);
      this.storage.save(newState);
      
      return response.access_token;
    } catch (error) {
      console.error('[AuthService] Token refresh failed', error);
      this.logout();
      throw error;
    }
  }

  logout() {
    this.state.set({
      accessToken: null,
      refreshToken: null,
      profile: null,
      isLoggedIn: false
    });
    this.storage.clear();
    this.wallet.disconnect();
  }
}
