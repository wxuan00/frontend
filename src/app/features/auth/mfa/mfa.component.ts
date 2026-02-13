import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mfa.component.html',
  styleUrls: ['./mfa.component.css']
})
export class MfaComponent implements OnInit {
  otpCode: string = '';
  errorMessage: string = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If user is already authenticated and MFA not required, redirect
    if (this.authService.getToken() && !sessionStorage.getItem('mfa_pending')) {
      this.router.navigate(['/dashboard']);
    }
  }

  verifyOtp() {
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter a 6-digit code';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>('http://localhost:8080/api/auth/mfa/verify', { code: this.otpCode }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          sessionStorage.removeItem('mfa_pending');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Verification failed. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  cancel() {
    this.authService.logout();
    sessionStorage.removeItem('mfa_pending');
    this.router.navigate(['/login']);
  }
}
