import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth'; // Connects to Spring Boot

  constructor(private http: HttpClient) { }

  // 1. Login Method
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // 2. Save the Token if login works
        if (response && response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  // 3. Helper to get the token later
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAllUsers(): Observable<any> {
    return this.http.get('http://localhost:8080/api/users');
  }

  // Create User
  createUser(user: any): Observable<any> {
    return this.http.post('http://localhost:8080/api/users', user);
  }

  // Delete User
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`http://localhost:8080/api/users/${id}`);
  }
}