import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent implements OnInit {

  userRole: string = '';

  constructor(
    private router: Router,
    public authService: AuthService // Inject Auth Service
  ) {}

  ngOnInit() {
    // Decode token to get role 
    this.userRole = this.authService.getUserRole();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

}
