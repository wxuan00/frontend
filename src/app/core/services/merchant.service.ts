import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {
  private apiUrl = 'http://localhost:8080/api/merchants';

  constructor(private http: HttpClient) {}

  // Get all merchants
  getAllMerchants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Search by name
  searchMerchants(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?name=${name}`);
  }

  // Create new merchant
  createMerchant(merchant: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, merchant);
  }
}