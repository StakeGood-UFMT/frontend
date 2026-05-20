import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { ActivityItem } from '../../../core/models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);

  async getActivities(): Promise<ActivityItem[]> {
    return firstValueFrom(
      this.http.get<ActivityItem[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.meActivity}`)
    );
  }
}
