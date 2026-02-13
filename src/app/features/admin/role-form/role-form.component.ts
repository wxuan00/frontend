import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  isEditMode = false;
  roleId: number | null = null;
  message = '';
  errorMessage = '';

  formData = {
    name: '',
    description: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.roleId = +idParam;
      this.roleService.getRoleById(this.roleId).subscribe({
        next: (role) => {
          this.formData = { name: role.name, description: role.description || '' };
        },
        error: () => this.errorMessage = 'Error loading role'
      });
    }
  }

  onSubmit() {
    this.message = '';
    this.errorMessage = '';

    if (this.isEditMode && this.roleId) {
      this.roleService.updateRole(this.roleId, this.formData).subscribe({
        next: () => {
          this.message = 'Role updated successfully';
          setTimeout(() => this.router.navigate(['/roles']), 1000);
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error updating role'
      });
    } else {
      this.roleService.createRole(this.formData).subscribe({
        next: () => {
          this.message = 'Role created successfully';
          setTimeout(() => this.router.navigate(['/roles']), 1000);
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error creating role'
      });
    }
  }

  cancel() {
    this.router.navigate(['/roles']);
  }
}
