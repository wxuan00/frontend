import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './role-detail.component.html',
  styleUrls: ['./role-detail.component.css']
})
export class RoleDetailComponent implements OnInit {
  role: any = null;
  loading = true;
  error = '';

  allPermissions: any[] = [];
  selectedPermIds: Set<number> = new Set();
  savingPerms = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Load role + all permissions in parallel
      this.roleService.getAllPermissions().subscribe({
        next: (perms) => { this.allPermissions = perms; }
      });
      this.roleService.getAllRolesWithPermissions().subscribe({
        next: (roles) => {
          this.role = roles.find(r => r.roleId === +id) || null;
          if (!this.role) {
            this.error = 'Role not found.';
          } else {
            this.selectedPermIds = new Set(
              (this.role.permissions || []).map((p: any) => p.permissionId)
            );
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load role details.';
          this.loading = false;
        }
      });
    }
  }

  getPermsByModule(): { module: string; perms: any[] }[] {
    const map: { [m: string]: any[] } = {};
    for (const p of this.allPermissions) {
      const mod = p.module || 'OTHER';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return Object.keys(map).sort().map(m => ({ module: m, perms: map[m] }));
  }

  togglePerm(permId: number) {
    if (this.selectedPermIds.has(permId)) {
      this.selectedPermIds.delete(permId);
    } else {
      this.selectedPermIds.add(permId);
    }
  }

  savePermissions() {
    if (!this.role) return;
    this.savingPerms = true;
    const ids = Array.from(this.selectedPermIds);
    this.roleService.updateRolePermissions(this.role.roleId, ids).subscribe({
      next: () => {
        this.toast.success(`Permissions updated for "${this.role.roleName}"`);
        this.savingPerms = false;
        // Refresh role to update count
        this.roleService.getAllRolesWithPermissions().subscribe({
          next: (roles) => {
            this.role = roles.find(r => r.roleId === this.role.roleId) || this.role;
          }
        });
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error saving permissions');
        this.savingPerms = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/roles']);
  }
}
