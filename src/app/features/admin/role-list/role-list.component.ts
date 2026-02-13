import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
  roles: any[] = [];
  showForm = false;
  editMode = false;
  editId: number | null = null;

  formData = {
    name: '',
    description: ''
  };

  message = '';
  errorMessage = '';

  constructor(private roleService: RoleService) {}

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
    this.editId = role.id;
    this.formData = { name: role.name, description: role.description || '' };
    this.showForm = true;
  }

  saveRole() {
    this.message = '';
    this.errorMessage = '';

    if (this.editMode && this.editId) {
      this.roleService.updateRole(this.editId, this.formData).subscribe({
        next: () => {
          this.message = 'Role updated successfully';
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error updating role'
      });
    } else {
      this.roleService.createRole(this.formData).subscribe({
        next: () => {
          this.message = 'Role created successfully';
          this.fetchRoles();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error creating role'
      });
    }
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => {
          this.message = 'Role deleted successfully';
          this.fetchRoles();
        },
        error: (err) => this.errorMessage = err.error?.message || 'Cannot delete this role'
      });
    }
  }

  resetForm() {
    this.editMode = false;
    this.editId = null;
    this.formData = { name: '', description: '' };
    this.message = '';
    this.errorMessage = '';
  }
}
