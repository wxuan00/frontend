import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Import Service

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Merchant Portal Dashboard</h1>
      <p>Welcome, Super Admin!</p>

      <div class="user-list">
        <h3>User List (Fetched from Backend)</h3>
        
        <div *ngIf="users.length === 0">Loading users...</div>

        <ul *ngIf="users.length > 0">
          <li *ngFor="let user of users">
            <span class="role">{{ user.role }}</span> 
            <strong>{{ user.displayName }}</strong> 
            <span class="email">({{ user.email }})</span>
          </li>
        </ul>
      </div>

      <button (click)="logout()" class="logout-btn">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 40px; max-width: 800px; margin: 0 auto; text-align: center; }
    .user-list { margin: 30px 0; text-align: left; border: 1px solid #ccc; padding: 20px; border-radius: 8px; background: #fff; }
    li { list-style: none; padding: 15px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; }
    .role { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
    .email { color: #666; font-style: italic; }
    .logout-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    .logout-btn:hover { background: #c82333; }
  `]
})
export class DashboardComponent implements OnInit {
  users: any[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    // 1. We call the service (The Interceptor automatically adds the Token!)
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        console.log('Users fetched:', data);
        this.users = data;
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        // If the token is expired/invalid, kick them out
        if (err.status === 403) {
          this.logout();
        }
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}