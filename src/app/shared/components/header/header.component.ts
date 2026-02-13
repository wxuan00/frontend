import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  userName: string = '';
  userRole: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    // Load user info
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userName = data.firstName ? `${data.firstName} ${data.lastName}` : (data.displayName || data.email);
      },
      error: () => {
        this.userName = 'User';
      }
    });
  }
}
