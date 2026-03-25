import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';
import { RouteRefreshService } from '../../../core/services/route-refresh.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit, OnDestroy {
  allRoles: any[] = [];
  roles: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;
  activeTab: 'bank' | 'merchant' = 'bank';
  loading = true;
  loadError = false;

  formData = {
    roleName: '',
    roleType: '',
    description: ''
  };
  formErrors: { [key: string]: string } = {};

  // Confirm dialog state
  showDeleteDialog = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  private refreshSub!: Subscription;

  constructor(private roleService: RoleService, private toast: ToastService, private routeRefresh: RouteRefreshService) {}

  ngOnInit(): void {
    this.fetchRoles();
    this.refreshSub = this.routeRefresh.refresh$.subscribe(() => this.fetchRoles());
  }

  ngOnDestroy(): void { this.refreshSub?.unsubscribe(); }

  fetchRoles() {
    this.loading = true;
    this.loadError = false;
    this.roleService.getAllRolesWithPermissions().subscribe({
      next: (data) => {
        this.allRoles = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  applyFilter() {
    if (this.activeTab === 'bank') {
      this.roles = this.allRoles.filter(r => {
        const type = (r.roleType || '').toUpperCase();
        return type === 'SYSTEM' || type === '';
      });
    } else {
      this.roles = this.allRoles.filter(r => {
        const type = (r.roleType || '').toUpperCase();
        return type === 'BUSINESS' || type === 'MERCHANT';
      });
    }
  }

  switchTab(tab: 'bank' | 'merchant') {
    this.activeTab = tab;
    this.showForm = false;
    this.resetForm();
    this.applyFilter();
  }

  get bankRoleCount(): number {
    return this.allRoles.filter(r => {
      const type = (r.roleType || '').toUpperCase();
      return type === 'SYSTEM' || type === '';
    }).length;
  }

  get merchantRoleCount(): number {
    return this.allRoles.filter(r => {
      const type = (r.roleType || '').toUpperCase();
      return type === 'BUSINESS' || type === 'MERCHANT';
    }).length;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  startEdit(role: any) {
    this.editMode = true;
    this.editId = role.roleId;
    this.formData = { roleName: role.roleName, roleType: role.roleType || '', description: role.description || '' };
    this.showForm = true;
  }

  saveRole() {
    this.formErrors = {};
    if (!this.formData.roleName.trim()) {
      this.formErrors['roleName'] = 'Role name is required';
    }
    if (Object.keys(this.formErrors).length > 0) return;

    if (this.editMode && this.editId) {
      // Only update name and description, NOT roleType
      const payload = { roleName: this.formData.roleName, description: this.formData.description, roleType: this.formData.roleType };
      this.roleService.updateRole(this.editId, payload).subscribe({
        next: () => {
          this.toast.success('Role updated successfully');
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          const msg = err.error?.message || 'Error updating role';
          this.formErrors['roleName'] = msg;
        }
      });
    } else {
      // Set roleType based on active tab
      const payload = {
        ...this.formData,
        roleType: this.activeTab === 'bank' ? 'SYSTEM' : 'BUSINESS'
      };
      this.roleService.createRole(payload).subscribe({
        next: () => {
          this.toast.success('Role created successfully');
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          const msg = err.error?.message || 'Error creating role';
          this.formErrors['roleName'] = msg;
        }
      });
    }
  }

  deleteRole(id: number, name: string = '') {
    this.deleteTargetId = id;
    this.deleteTargetName = name;
    this.showDeleteDialog = true;
  }

  confirmDeleteRole() {
    if (this.deleteTargetId !== null) {
      this.roleService.deleteRole(this.deleteTargetId).subscribe({
        next: () => {
          this.toast.success('Role deleted successfully');
          this.fetchRoles();
        },
        error: (err) => this.toast.error(err.error?.message || 'Cannot delete this role')
      });
    }
    this.showDeleteDialog = false;
  }

  cancelDeleteRole() {
    this.showDeleteDialog = false;
    this.deleteTargetId = null;
  }

  resetForm() {
    this.editMode = false;
    this.editId = null;
    this.formData = { roleName: '', roleType: '', description: '' };
    this.formErrors = {};
  }
}
