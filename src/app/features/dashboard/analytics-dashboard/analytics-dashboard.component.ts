import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      
      <div class="header-row">
        <h1>Merchant Portal Administration</h1>
        <button (click)="logout()" class="logout-btn">Logout</button>
      </div>

      <div class="card">
        <h3>Onboard New User</h3>
        <form (ngSubmit)="addUser()" class="form-grid">
          
          <div class="form-group">
            <label>First Name</label>
            <input type="text" [(ngModel)]="newUser.firstName" name="firstName" required>
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input type="text" [(ngModel)]="newUser.lastName" name="lastName" required>
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="newUser.email" name="email" required>
          </div>

          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" [(ngModel)]="newUser.phoneNumber" name="phoneNumber" placeholder="+65 9123 4567">
          </div>

          <div class="form-group">
            <label>Role</label>
            <select [(ngModel)]="newUser.role" name="role">
              <option value="MERCHANT">Merchant User</option>
              <option value="ADMIN">Admin User</option>
            </select>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select [(ngModel)]="newUser.status" name="status">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label>Password</label>
            <input type="password" [(ngModel)]="newUser.password" name="password" required>
          </div>

          <button type="submit" class="add-btn full-width">Create Account</button>
        </form>
      </div>

      <div class="card">
        <h3>System Users</h3>
        <table class="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>
                {{ user.firstName }} {{ user.lastName }}
                <span *ngIf="!user.firstName">{{ user.displayName }}</span>
              </td>
              <td>{{ user.email }}</td>
              <td><strong>{{ user.role }}</strong></td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + (user.status?.toLowerCase() || 'unknown')">
                  {{ user.status || 'Unknown' }}
                </span>
              </td>
              <td>
                <button (click)="deleteUser(user.id)" class="delete-btn">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  users: any[] = [];
  
  // Updated Model to match requirements
  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'USER',
    status: 'ACTIVE'
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error(err)
    });
  }

  addUser() {
    this.authService.createUser(this.newUser).subscribe({
      next: (res) => {
        alert('User Created Successfully!');
        this.fetchUsers();
        // Reset form
        this.newUser = { 
          firstName: '', lastName: '', email: '', password: '', 
          phoneNumber: '', role: 'USER', status: 'ACTIVE' 
        };
      },
      error: (err) => alert('Error creating user: ' + err.message)
    });
  }

  deleteUser(id: number) {
    if(confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert('Error deleting user')
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}