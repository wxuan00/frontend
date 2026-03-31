import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/index';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  users: User[] = [];
  loading = true;
  loadError = false;
  showForm = false;
  searchTerm = '';
  filterStatus = '';
  activeTab: 'bank' | 'merchant' = 'bank';

  private navSub?: Subscription;

  // Pagination
  pagination = { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 };

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: 'P@ssw0rd',
    contactNumber: '',
    role: 'ADMIN',
    status: 'ACTIVE'
  };
  formErrors: { [key: string]: string } = {};

  // Permissions per role
  rolePermissionsMap: { [roleName: string]: any[] } = {};

  // Confirm dialog state
  showDeleteDialog = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchRolePermissions();
    // Re-fetch whenever navigating back to this page
    this.navSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && e.urlAfterRedirects === '/users')
    ).subscribe(() => {
      this.fetchUsers();
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  fetchRolePermissions() {
    this.roleService.getAllRolesWithPermissions().subscribe({
      next: (roles) => {
        roles.forEach(r => {
          this.rolePermissionsMap[r.roleName] = r.permissions || [];
        });
      }
    });
  }

  fetchUsers() {
    this.loading = true;
    this.loadError = false;
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.allUsers = data as User[];
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  applyFilters() {
    let filtered = [...this.allUsers];

    // Filter by tab (role)
    if (this.activeTab === 'bank') {
      filtered = filtered.filter(u => u.role === 'ADMIN');
    } else {
      filtered = filtered.filter(u => u.role === 'MERCHANT');
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.firstName || '').toLowerCase().includes(term) ||
        (u.lastName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        ((u as any).displayName || '').toLowerCase().includes(term)
      );
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
    if (this.showForm) {
      this.newUser.role = this.activeTab === 'bank' ? 'ADMIN' : 'MERCHANT';
    }
  }

  switchTab(tab: 'bank' | 'merchant') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.filterStatus = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.showForm = false;
    this.pagination.currentPage = 1;
    this.newUser.role = tab === 'bank' ? 'ADMIN' : 'MERCHANT';
    this.applyFilters();
  }

  addUser() {
    this.formErrors = {};
    if (!this.newUser.firstName.trim()) this.formErrors['firstName'] = 'First name is required';
    if (!this.newUser.lastName.trim()) this.formErrors['lastName'] = 'Last name is required';
    if (!this.newUser.email.trim()) {
      this.formErrors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newUser.email)) {
      this.formErrors['email'] = 'Invalid email format';
    }
    if (Object.keys(this.formErrors).length > 0) return;

    this.newUser.password = 'P@ssw0rd';
    this.authService.createUser(this.newUser).subscribe({
      next: () => {
        this.toast.success('User created successfully (Default password: P@ssw0rd)');
        this.fetchUsers();
        this.showForm = false;
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error creating user';
        if (msg.toLowerCase().includes('email')) {
          this.formErrors['email'] = msg;
        } else {
          this.formErrors['firstName'] = msg;
        }
      }
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
      firstName: '', lastName: '', email: '', password: 'P@ssw0rd',
      contactNumber: '', role: this.activeTab === 'bank' ? 'ADMIN' : 'MERCHANT', status: 'ACTIVE'
    };
    this.formErrors = {};
  }

  getUserPermissions(user: User): any[] {
    return this.rolePermissionsMap[user.role] || [];
  }

  get bankUserCount(): number {
    return this.allUsers.filter(u => u.role === 'ADMIN').length;
  }

  get merchantUserCount(): number {
    return this.allUsers.filter(u => u.role === 'MERCHANT').length;
  }
}
