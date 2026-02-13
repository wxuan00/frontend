import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  allUsers: any[] = [];
  users: any[] = [];
  showForm = false;
  searchTerm = '';
  filterRole = '';
  filterStatus = '';

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'MERCHANT',
    status: 'ACTIVE'
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.allUsers = data;
        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  applyFilters() {
    let filtered = [...this.allUsers];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.firstName || '').toLowerCase().includes(term) ||
        (u.lastName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.displayName || '').toLowerCase().includes(term)
      );
    }
    if (this.filterRole) {
      filtered = filtered.filter(u => u.role === this.filterRole);
    }
    if (this.filterStatus) {
      filtered = filtered.filter(u => u.status === this.filterStatus);
    }
    this.users = filtered;
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  addUser() {
    this.authService.createUser(this.newUser).subscribe({
      next: () => {
        this.fetchUsers();
        this.showForm = false;
        this.resetForm();
      },
      error: (err) => alert('Error creating user: ' + (err.error?.message || err.message))
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert('Error deleting user')
      });
    }
  }

  resetForm() {
    this.newUser = {
      firstName: '', lastName: '', email: '', password: '',
      phoneNumber: '', role: 'MERCHANT', status: 'ACTIVE'
    };
  }
}
