import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  userName: string = '';
  totalUsers: number = 0;
  totalMerchants: number = 0;
  activeMerchants: number = 0;
  pendingMerchants: number = 0;
  totalTransactions: number = 0;
  totalSettlements: number = 0;
  recentUsers: any[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    
    // Load user info
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userName = data.firstName || data.displayName || 'User';
      }
    });

    // Load dashboard stats from the dedicated endpoint
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.totalMerchants = stats.totalMerchants || 0;
        this.activeMerchants = stats.activeMerchants || 0;
        this.pendingMerchants = stats.pendingMerchants || 0;
        this.totalTransactions = stats.totalTransactions || 0;
        this.totalSettlements = stats.totalSettlements || 0;

        if (this.userRole === 'ADMIN') {
          this.totalUsers = stats.totalUsers || 0;
          this.recentUsers = stats.recentUsers || [];
        }
      }
    });
  }
}