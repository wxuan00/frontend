import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // Import FormsModule for [(ngModel)]
  template: `
    <div class="login-container">
      <h2>Merchant Portal Login</h2>
      
      <form (ngSubmit)="onLogin()">
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" required>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" name="password" required>
        </div>

        <button type="submit">Login</button>
      </form>

      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .login-container { max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
    .form-group { margin-bottom: 15px; }
    input { width: 100%; padding: 8px; margin-top: 5px; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
    .error { color: red; margin-top: 10px; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    const credentials = { email: this.email, password: this.password };
    
    this.authService.login(credentials).subscribe({
      next: (res) => {
        console.log('Login Success! Token:', res.token);
        //alert('Login Successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login Failed', err);
        this.errorMessage = 'Invalid Email or Password';
      }
    });
  }
}