import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {
  private apiUrl = 'http://localhost:8001/api/merchants';

  constructor(private http: HttpClient) {}

  // Get all merchants
  getAllMerchants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Get merchant by ID
  getMerchantById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Search by name
  searchMerchants(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?name=${name}`);
  }

  // Create new merchant
  createMerchant(merchant: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, merchant);
  }

  // Update merchant
  updateMerchant(id: number, merchant: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, merchant);
  }

  // Delete merchant
  deleteMerchant(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}