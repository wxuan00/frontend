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
      <h1>Merchant Portal Dashboard</h1>
      <button (click)="logout()" class="logout-btn">Logout</button>

      <div class="card form-card">
        <h3>Add New User</h3>
        <form (ngSubmit)="addUser()">
          <input type="text" [(ngModel)]="newUser.displayName" name="name" placeholder="Full Name" required>
          <input type="email" [(ngModel)]="newUser.email" name="email" placeholder="Email" required>
          <input type="password" [(ngModel)]="newUser.password" name="password" placeholder="Password" required>
          
          <select [(ngModel)]="newUser.role" name="role">
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>

          <button type="submit" class="add-btn">Create User</button>
        </form>
      </div>

      <div class="card list-card">
        <h3>System Users</h3>
        <ul>
          <li *ngFor="let user of users">
            <div class="user-info">
              <span class="role">{{ user.role }}</span>
              <strong>{{ user.displayName }}</strong>
              <small>({{ user.email }})</small>
            </div>
            <button (click)="deleteUser(user.id)" class="delete-btn">X</button>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 800px; margin: 40px auto; font-family: sans-serif; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
    
    /* Form Styles */
    form { display: flex; gap: 10px; flex-wrap: wrap; }
    input, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; flex: 1; }
    .add-btn { background: #28a745; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; }
    
    /* List Styles */
    ul { padding: 0; }
    li { list-style: none; padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .role { background: #007bff; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-right: 8px; }
    .delete-btn { background: #dc3545; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; }
    
    .logout-btn { float: right; background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-bottom: 10px;}
  `]
})

export class DashboardComponent implements OnInit {
  users: any[] = [];
  
  // Model for the new user form
  newUser = {
    displayName: '',
    email: '',
    password: '',
    role: 'USER',
    isMfaEnabled: false
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

  // 3. Logic to Add User
  addUser() {
    this.authService.createUser(this.newUser).subscribe({
      next: (res) => {
        alert('User Created!');
        this.fetchUsers(); // Refresh the list
        // Reset form
        this.newUser = { displayName: '', email: '', password: '', role: 'USER', isMfaEnabled: false };
      },
      error: (err) => alert('Error creating user: ' + err.message)
    });
  }

  // 4. Logic to Delete User
  deleteUser(id: number) {
    if(confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.fetchUsers(); // Refresh list
        },
        error: (err) => alert('Error deleting user')
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}