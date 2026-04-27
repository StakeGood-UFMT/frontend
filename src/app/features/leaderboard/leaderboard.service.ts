import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';

export interface LeaderboardEntry {
  rank?: number;
  id: string;
  username: string;
  reputation: number;
  avatar_url?: string;
  privacy_mode?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private base = API_CONFIG.baseUrl;

  getLeaderboard(range = '7d', q = '', page = 1, limit = 10): Observable<{ items: LeaderboardEntry[]; total: number; top3?: LeaderboardEntry[] }> {
    const params = new HttpParams()
      .set('range', range)
      .set('q', q)
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<{ items: LeaderboardEntry[]; total: number; top3?: LeaderboardEntry[] }>(`${this.base}/leaderboard`, { params });
  }
}
