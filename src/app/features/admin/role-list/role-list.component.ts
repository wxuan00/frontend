import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
  roles: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  formData = {
    roleName: '',
    roleType: '',
    description: ''
  };

  // Confirm dialog state
  showDeleteDialog = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  constructor(private roleService: RoleService, private toast: ToastService) {}

  ngOnInit(): void {
    this.fetchRoles();
  }

  fetchRoles() {
    this.roleService.getAllRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error(err)
    });
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
    if (this.editMode && this.editId) {
      this.roleService.updateRole(this.editId, this.formData).subscribe({
        next: () => {
          this.toast.success('Role updated successfully');
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating role')
      });
    } else {
      this.roleService.createRole(this.formData).subscribe({
        next: () => {
          this.toast.success('Role created successfully');
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating role')
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
  }
}
