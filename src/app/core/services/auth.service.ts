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
        // 2. Save the Token and Role if login works
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('role', response.role);
        }
      })
    );
  }

  // 3. Helper to get the token later
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get current user info from backend
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
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

  // Update User
  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`http://localhost:8080/api/users/${id}`, user);
  }

  // Get User by ID
  getUserById(id: number): Observable<any> {
    return this.http.get(`http://localhost:8080/api/users/${id}`);
  }

  // Profile endpoints
  getProfile(): Observable<any> {
    return this.http.get('http://localhost:8080/api/profile');
  }

  updateProfile(updates: any): Observable<any> {
    return this.http.put('http://localhost:8080/api/profile', updates);
  }

  changePassword(passwords: any): Observable<any> {
    return this.http.put('http://localhost:8080/api/profile/password', passwords);
  }

  // Helper method to get user role from localStorage
  getUserRole(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('role') || ''; 
    }
    return '';
  }

  // Helper to check if user is Admin
  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  // Logout - clear all stored data
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
}