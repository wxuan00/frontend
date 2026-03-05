import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/index';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  users: User[] = [];
  loading = true;
  showForm = false;
  searchTerm = '';
  filterRole = '';
  filterStatus = '';

  // Pagination
  pagination = { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 };

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    role: 'MERCHANT',
    status: 'ACTIVE'
  };

  // Confirm dialog state
  showDeleteDialog = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  constructor(private authService: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.allUsers = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
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
        ((u as any).displayName || '').toLowerCase().includes(term)
      );
    }
    if (this.filterRole) {
      filtered = filtered.filter(u => u.role === this.filterRole);
    }
    if (this.filterStatus) {
      filtered = filtered.filter(u => u.status === this.filterStatus);
    }

    // Sorting
    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        const valA = (a[this.sortColumn] || '').toString().toLowerCase();
        const valB = (b[this.sortColumn] || '').toString().toLowerCase();
        const cmp = valA.localeCompare(valB);
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    this.filteredUsers = filtered;
    this.pagination.totalItems = filtered.length;
    this.pagination.totalPages = Math.max(1, Math.ceil(filtered.length / this.pagination.pageSize));
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = 1;
    }
    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    this.users = filtered.slice(start, start + this.pagination.pageSize);
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.applyFilters();
  }

  onPageSizeChange(size: number) {
    this.pagination.pageSize = size;
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  addUser() {
    this.authService.createUser(this.newUser).subscribe({
      next: () => {
        this.toast.success('User created successfully');
        this.fetchUsers();
        this.showForm = false;
        this.resetForm();
      },
      error: (err) => this.toast.error('Error creating user: ' + (err.error?.message || err.message))
    });
  }

  deleteUser(id: number, name: string = '') {
    this.deleteTargetId = id;
    this.deleteTargetName = name;
    this.showDeleteDialog = true;
  }

  confirmDelete() {
    if (this.deleteTargetId !== null) {
      this.authService.deleteUser(this.deleteTargetId).subscribe({
        next: () => {
          this.toast.success('User deleted successfully');
          this.fetchUsers();
        },
        error: (err) => this.toast.error('Failed to delete user')
      });
    }
    this.showDeleteDialog = false;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.deleteTargetId = null;
  }

  resetForm() {
    this.newUser = {
      firstName: '', lastName: '', email: '', password: '',
      contactNumber: '', role: 'MERCHANT', status: 'ACTIVE'
    };
  }
}
