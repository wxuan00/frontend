import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:8001/api/reports';

  constructor(private http: HttpClient) {}

  getSummaryReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

  exportSummaryReportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/summary/export`, {
      responseType: 'blob'
    });
  }

  exportTransactionsCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/transactions/export`, {
      responseType: 'blob'
    });
  }

  exportSettlementsCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/settlements/export`, {
      responseType: 'blob'
    });
  }
}
