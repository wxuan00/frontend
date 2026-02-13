import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private apiUrl = 'http://localhost:8080/api/settlements';

  constructor(private http: HttpClient) {}

  getAllSettlements(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getSettlementById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  searchSettlements(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }
}
