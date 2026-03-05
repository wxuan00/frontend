import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  isEditMode = false;
  userId: number | null = null;
  merchants: any[] = [];
  message = '';
  errorMessage = '';

  formData: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
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
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Load merchants for dropdown
    this.merchantService.getAllMerchants().subscribe({
      next: (data) => this.merchants = data,
      error: () => {}
    });

    // Check if editing
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.userId = +idParam;
      this.authService.getUserById(this.userId).subscribe({
        next: (user) => {
          if (user) {
            this.formData = {
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              password: '',
              contactNumber: user.contactNumber || '',
              displayName: user.displayName || '',
              role: user.role || 'MERCHANT',
              status: user.status || 'ACTIVE'
            };
          }
        },
        error: () => this.errorMessage = 'Error loading user details'
      });
    }
  }

  onSubmit() {
    if (this.isEditMode && this.userId) {
      // Don't send password if empty
      const payload = { ...this.formData };
      if (!payload.password) delete payload.password;

      this.authService.updateUser(this.userId, payload).subscribe({
        next: () => {
          this.toast.success('User updated successfully');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating user')
      });
    } else {
      this.authService.createUser(this.formData).subscribe({
        next: () => {
          this.toast.success('User created successfully');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating user')
      });
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
