import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/http/config/api.config';
import { DashboardOverview } from '@features/dashboard/models/dashboard-overview.model';

@Service()
export class DashboardApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);
  overview(from: string, to: string): Observable<DashboardOverview> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.httpClient.get<DashboardOverview>(`${this.apiBaseUrl}/dashboard/overview`, { params });
  }
}
