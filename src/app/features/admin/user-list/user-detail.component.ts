import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.authService.getUserDetails(+id).subscribe({
        next: (data) => {
          this.user = data;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load user details.';
          this.loading = false;
        }
      });
    }
  }

  getPermsByModule(): { module: string; perms: any[] }[] {
    if (!this.user?.permissions?.length) return [];
    const map: { [m: string]: any[] } = {};
    for (const p of this.user.permissions) {
      const mod = p.module || 'OTHER';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return Object.keys(map).sort().map(m => ({ module: m, perms: map[m] }));
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  goEdit() {
    this.router.navigate(['/users', this.user.userId, 'edit']);
  }
}
