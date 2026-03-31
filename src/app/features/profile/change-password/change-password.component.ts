import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  errorMessage = '';
  isForced = false; // true when mustChangePassword flag is set

  constructor(private authService: AuthService, private router: Router, private toast: ToastService) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => { this.isForced = !!user.mustChangePassword; },
      error: () => {}
    });
  }

  get passwordErrors(): string[] {
    const errors: string[] = [];
    const p = this.newPassword;
    if (!p) return errors;
    if (p.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(p)) errors.push('At least 1 uppercase letter');
    if (!/[a-z]/.test(p)) errors.push('At least 1 lowercase letter');
    if (!/[0-9]/.test(p)) errors.push('At least 1 number');
    if (!/[^A-Za-z0-9]/.test(p)) errors.push('At least 1 special character');
    return errors;
  }

  get isPasswordValid(): boolean {
    return this.passwordErrors.length === 0;
  }

  onSubmit() {
    if (!this.isPasswordValid) {
      this.toast.error('Password does not meet requirements');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('New passwords do not match');
      return;
    }

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Password changed successfully!');
        if (this.isForced) {
          // Clear the forced flag, then go to dashboard
          this.authService.clearMustChangePassword().subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard'])
          });
        } else {
          setTimeout(() => this.router.navigate(['/profile']), 1500);
        }
      },
      error: (err) => {
        this.toast.error(err.error?.error || err.error?.message || 'Error changing password');
      }
    });
  }

  cancel() {
    if (this.isForced) {
      this.toast.error('You must change your password before continuing.');
    } else {
      this.router.navigate(['/profile']);
    }
  }

}
