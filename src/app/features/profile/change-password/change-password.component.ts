import { Component } from '@angular/core';
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
export class ChangePasswordComponent {

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router, private toast: ToastService) { }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('New passwords do not match');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Password changed successfully!');
        setTimeout(() => this.router.navigate(['/profile']), 1500);
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Error changing password');
      }
    });
  }

  cancel() {
    this.router.navigate(['/profile']);
  }

}
