import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreditAdviceService {
  private apiUrl = 'http://localhost:8080/api/credit-advices';

  constructor(private http: HttpClient) {}

  getAllCreditAdvices(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getCreditAdviceById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  searchCreditAdvices(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }
}
