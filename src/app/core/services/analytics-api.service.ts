import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  private apiUrl = 'http://localhost:8001/api/analytics';

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

  // ===== AI Model Endpoints =====

  getRfmSegments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rfm`);
  }

  getChurnRisk(churnDays = 90): Observable<any> {
    const params = new HttpParams().set('churnDays', churnDays.toString());
    return this.http.get<any>(`${this.apiUrl}/churn`, { params });
  }

  getCashFlowForecast(horizonDays = 30): Observable<any> {
    const params = new HttpParams().set('horizonDays', horizonDays.toString());
    return this.http.get<any>(`${this.apiUrl}/forecast`, { params });
  }
}
