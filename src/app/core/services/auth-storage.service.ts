import { Injectable } from '@angular/core';
import { AuthState } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {
  private readonly STORAGE_KEY = 'stakegood_auth';

  save(state: AuthState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  load(): AuthState | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('[AuthStorageService] Error parsing auth state', e);
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
