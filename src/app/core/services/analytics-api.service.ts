import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  private apiUrl = 'http://localhost:8080/api/analytics';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/overview`);
  }

  getTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/trends`);
  }

  getScorecard(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scorecard`);
  }

  getAnomalies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/anomalies`);
  }

  getRevenueBreakdown(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/revenue`);
  }

  getInsights(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/insights`);
  }

  recomputeAnalytics(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recompute`, {});
  }

  getMerchantRecords(merchantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/records/${merchantId}`);
  }
}
