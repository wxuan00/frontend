import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Welcome to Merchant Portal</h1>
      <p>You have successfully logged in.</p>
      
      <div class="card-grid">
        <div class="card">Manage Users</div>
        <div class="card">View Reports</div>
        <div class="card">Settings</div>
      </div>

      <button (click)="logout()" class="logout-btn">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 40px; text-align: center; }
    .card-grid { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
    .card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; width: 150px; background: #f9f9f9; }
    .logout-btn { padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 4px; }
  `]
})
export class DashboardComponent {
  
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token'); // Delete the "Passport"
    this.router.navigate(['/login']); // Go back to login
  }
}