import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  isEditMode = false;
  userId: number | null = null;
  merchants: any[] = [];
  allRoles: any[] = [];
  selectedRoleIds = new Set<number>();
  message = '';
  errorMessage = '';

  // Delete dialog
  showDeleteDialog = false;
  deleteLabel = '';

  formData: any = {
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    displayName: '',
    role: 'MERCHANT',
    status: 'ACTIVE'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private merchantService: MerchantService,
    private roleService: RoleService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.merchantService.getAllMerchants().subscribe({
      next: (data) => this.merchants = data,
      error: () => {}
    });

    this.roleService.getAllRolesWithPermissions().subscribe({
      next: (data) => this.allRoles = data,
      error: () => {}
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.userId = +idParam;
      this.authService.getUserDetails(this.userId).subscribe({
        next: (user) => {
          if (user) {
            this.formData = {
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              contactNumber: user.contactNumber || '',
              displayName: user.displayName || '',
              role: user.role || 'MERCHANT',
              status: user.status || 'ACTIVE'
            };
            // Pre-select all assigned roles
            if (user.roles && user.roles.length > 0) {
              this.selectedRoleIds = new Set(user.roles.map((r: any) => r.roleId));
            }
          }
        },
        error: () => this.errorMessage = 'Error loading user details'
      });
    }
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.has(roleId);
  }

  toggleRole(roleId: number) {
    if (this.selectedRoleIds.has(roleId)) {
      this.selectedRoleIds.delete(roleId);
    } else {
      this.selectedRoleIds.add(roleId);
    }
  }

  /** Roles filtered to match the user's type (ADMIN→SYSTEM, MERCHANT→BUSINESS/MERCHANT) */
  get filteredRoles(): any[] {
    if (this.formData.role === 'ADMIN') {
      return this.allRoles.filter(r => {
        const t = (r.roleType || '').toUpperCase();
        return t === 'SYSTEM' || t === '';
      });
    } else {
      return this.allRoles.filter(r => {
        const t = (r.roleType || '').toUpperCase();
        return t === 'BUSINESS' || t === 'MERCHANT';
      });
    }
  }

  onSubmit() {
    if (this.isEditMode && this.userId) {
      const { ...payload } = this.formData;

      this.authService.updateUser(this.userId, payload).subscribe({
        next: () => {
          const roleIds = Array.from(this.selectedRoleIds);
          this.roleService.syncUserRoles(this.userId!, roleIds).subscribe({
            next: () => {
              this.toast.success('User updated successfully');
              setTimeout(() => this.router.navigate(['/users']), 1000);
            },
            error: (err) => {
              this.toast.error('User saved but role sync failed: ' + (err.error?.message || err.message || 'unknown error'));
              setTimeout(() => this.router.navigate(['/users']), 2000);
            }
          });
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating user')
      });
    } else {
      this.authService.createUser(this.formData).subscribe({
        next: (created) => {
          const roleIds = Array.from(this.selectedRoleIds);
          if (roleIds.length > 0 && created?.userId) {
            this.roleService.syncUserRoles(created.userId, roleIds).subscribe();
          }
          this.toast.success('User created successfully');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating user')
      });
    }
  }

  confirmDelete() {
    this.deleteLabel = (this.formData.firstName + ' ' + this.formData.lastName).trim() || this.formData.email;
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed() {
    if (this.userId) {
      this.authService.deleteUser(this.userId).subscribe({
        next: () => {
          this.toast.success('User deleted successfully');
          this.router.navigate(['/users']);
        },
        error: () => this.toast.error('Failed to delete user')
      });
    }
    this.showDeleteDialog = false;
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
