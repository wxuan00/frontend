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
  errors: Record<string, string> = {};

  formErrorMessage = '';

  /** Locked user type determined from query param on create ('ADMIN' | 'MERCHANT') */
  userType: 'ADMIN' | 'MERCHANT' = 'MERCHANT';

  // Merchant mapping (create mode, MERCHANT type only)
  merchantSearchQuery = '';
  merchantSearchResults: any[] = [];
  selectedMerchant: any = null;
  showMerchantDropdown = false;

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

    // On create: lock user type from query param (ADMIN = Bank User, MERCHANT = Merchant User)
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam === 'ADMIN' || typeParam === 'MERCHANT') {
      this.userType = typeParam;
      this.formData.role = typeParam;
    }

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
            this.userType = (user.role === 'ADMIN' ? 'ADMIN' : 'MERCHANT');
            if (user.roles && user.roles.length > 0) {
              this.selectedRoleIds = new Set(user.roles.map((r: any) => r.roleId));
            }
          }
        },
        error: () => this.errorMessage = 'Error loading user details'
      });
    }
  }

  onMerchantSearch(q: string) {
    if (this.errors['merchant']) delete this.errors['merchant'];
    this.filterMerchants(q);
  }

  onMerchantFocus() {
    if (this.errors['merchant']) delete this.errors['merchant'];
    this.filterMerchants(this.merchantSearchQuery);
    this.showMerchantDropdown = true;
  }

  onMerchantBlur() {
    // Delay hiding so click on dropdown item registers first
    setTimeout(() => { this.showMerchantDropdown = false; }, 200);
  }

  private filterMerchants(q: string) {
    const term = q.trim().toLowerCase();
    if (!term) {
      this.merchantSearchResults = this.merchants;
    } else {
      this.merchantSearchResults = this.merchants.filter(m =>
        m.merchantName?.toLowerCase().includes(term) ||
        String(m.merchantId).includes(term)
      );
    }
    this.showMerchantDropdown = true;
  }

  selectMerchant(m: any) {
    this.selectedMerchant = m;
    this.merchantSearchQuery = `#${m.merchantId} - ${m.merchantName}`;
    this.merchantSearchResults = [];
    this.showMerchantDropdown = false;
  }

  clearMerchant() {
    this.selectedMerchant = null;
    this.merchantSearchQuery = '';
    this.merchantSearchResults = [];
    this.showMerchantDropdown = false;
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

  onDisplayNameBlur() {
    const name = this.formData.displayName?.trim();
    if (!name) {
      delete this.errors['displayName'];
      return;
    }
    const excludeId = this.isEditMode && this.userId ? String(this.userId) : undefined;
    this.authService.checkDisplayName(name, excludeId).subscribe({
      next: (res: any) => {
        if (res.taken) {
          this.errors['displayName'] = `Display name "${name}" is already taken.`;
        } else {
          delete this.errors['displayName'];
        }
      },
      error: () => {}
    });
  }

  get filteredRoles(): any[] {
    if (this.formData.role === 'ADMIN') {
      // Admin users: show SYSTEM roles (includes ADMIN base role and SYSTEM custom roles)
      return this.allRoles.filter(r => {
        const t = (r.roleType || '').toUpperCase();
        return t === 'SYSTEM' || t === '';
      });
    } else {
      // Merchant users: show MERCHANT system role + BUSINESS custom roles — all must be explicitly chosen
      return this.allRoles.filter(r => {
        const n = (r.roleName || '').toUpperCase();
        const t = (r.roleType || '').toUpperCase();
        return n === 'MERCHANT' || t === 'BUSINESS' || t === 'MERCHANT';
      });
    }
  }

  validate(): boolean {
    // Preserve async errors (e.g. displayName taken) — only re-check sync fields
    const asyncErrors: Record<string, string> = {};
    if (this.errors['displayName']) asyncErrors['displayName'] = this.errors['displayName'];

    this.errors = { ...asyncErrors };
    if (!this.formData.firstName?.trim()) this.errors['firstName'] = 'First name is required.';
    if (!this.formData.lastName?.trim()) this.errors['lastName'] = 'Last name is required.';
    if (!this.formData.email?.trim()) {
      this.errors['email'] = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      this.errors['email'] = 'Please enter a valid email address.';
    }
    if (this.selectedRoleIds.size === 0) {
      this.errors['roles'] = 'At least one role must be assigned.';
    }
    if (!this.isEditMode && this.userType === 'MERCHANT' && !this.selectedMerchant) {
      this.errors['merchant'] = 'A merchant must be selected for Merchant users.';
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {

    this.formErrorMessage = '';
    if (!this.validate()) return;

    if (this.isEditMode && this.userId) {
      const { ...payload } = this.formData;
      this.authService.updateUser(this.userId, payload).subscribe({
        next: () => {
          const roleIds = Array.from(this.selectedRoleIds);
          this.roleService.syncUserRoles(this.userId!, roleIds).subscribe({
            next: () => {
              this.toast.success('User updated successfully');
              setTimeout(() => this.router.navigate(['/users', this.userId, 'view']), 1000);
            },
            error: (err) => {
              this.formErrorMessage = 'User saved but role sync failed: ' + (err.error?.message || err.message || 'unknown error');
              setTimeout(() => this.router.navigate(['/users', this.userId, 'view']), 2000);
            }
          });
        },
        error: (err) => this.formErrorMessage = err.error?.message || 'Error updating user'
      });
    } else {
      this.authService.createUser(this.formData).subscribe({
        next: (created) => {
          // Always include the base system role (ADMIN/MERCHANT) so userType classification
          // in getAllUsers remains correct after syncRoles wipes and re-inserts all roles.
          const baseRoleName = (this.formData.role || '').toUpperCase(); // 'ADMIN' or 'MERCHANT'
          const baseRole = this.allRoles.find(
            r => (r.roleName || '').toUpperCase() === baseRoleName
          );
          const roleIds = Array.from(this.selectedRoleIds);
          if (baseRole && !roleIds.includes(baseRole.roleId)) {
            roleIds.push(baseRole.roleId);
          }
          if (roleIds.length > 0 && created?.userId) {
            this.roleService.syncUserRoles(created.userId, roleIds).subscribe();
          }
          if (this.selectedMerchant && created?.userId && this.userType === 'MERCHANT') {
            this.merchantService.assignUserToMerchant(this.selectedMerchant.merchantId, created.userId).subscribe({
              error: () => this.formErrorMessage = 'User created but merchant mapping failed'
            });
          }
          this.toast.success('User created successfully');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (err) => this.formErrorMessage = err.error?.message || 'Error creating user'
      });
    }
  }

  confirmDelete() {
    const fullName = (this.formData.firstName + ' ' + this.formData.lastName).trim();
    this.deleteLabel = this.formData.displayName?.trim() || fullName || this.formData.email;
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed() {
    if (this.userId) {
      this.authService.deleteUser(this.userId).subscribe({
        next: () => {
          this.toast.success('User deleted successfully');
          this.router.navigate(['/users']);
        },
        error: () => this.formErrorMessage = 'Failed to delete user'
      });
    }
    this.showDeleteDialog = false;
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
