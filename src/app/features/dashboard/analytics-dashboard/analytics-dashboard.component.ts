import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  userRole: string = '';
  userName: string = '';
  totalUsers: number = 0;
  totalMerchants: number = 0;
  activeMerchants: number = 0;
  pendingMerchants: number = 0;
  totalTransactions: number = 0;
  totalSettlements: number = 0;
  recentUsers: any[] = [];
  insights: any[] = [];
  insightsLoading = true;
  chartsLoading = true;
  chartData: any = null;

  private charts: Chart[] = [];

  @ViewChild('txnStatusChart') txnStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyVolumeChart') dailyVolumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChannelChart') paymentChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('settlementTypesChart') settlementTypesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amountByCurrencyChart') amountByCurrencyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topMerchantsChart') topMerchantsCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userName = data.firstName || data.displayName || 'User';
      }
    });

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

    this.dashboardService.getInsights().subscribe({
      next: (data) => {
        this.insights = data;
        this.insightsLoading = false;
      },
      error: () => {
        this.insightsLoading = false;
      }
    });
  }

  ngAfterViewInit() {
    this.dashboardService.getChartData().subscribe({
      next: (data) => {
        this.chartData = data;
        this.chartsLoading = false;
        setTimeout(() => this.renderCharts(), 50);
      },
      error: () => {
        this.chartsLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  private renderCharts() {
    if (!this.chartData) return;

    // 1. Transaction Status Doughnut
    if (this.txnStatusCanvas && this.chartData.transactionStatus) {
      const data = this.chartData.transactionStatus;
      this.charts.push(new Chart(this.txnStatusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data) as number[],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
          },
          cutout: '65%'
        }
      }));
    }

    // 2. Daily Volume Line Chart
    if (this.dailyVolumeCanvas && this.chartData.dailyTransactionVolume) {
      const data = this.chartData.dailyTransactionVolume;
      this.charts.push(new Chart(this.dailyVolumeCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Transactions',
            data: Object.values(data) as number[],
            borderColor: '#111',
            backgroundColor: 'rgba(17, 17, 17, 0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#111',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      }));
    }

    // 3. Payment Channel Distribution
    if (this.paymentChannelCanvas && this.chartData.paymentChannelDistribution) {
      const data = this.chartData.paymentChannelDistribution;
      this.charts.push(new Chart(this.paymentChannelCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data) as number[],
            backgroundColor: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
          },
          cutout: '65%'
        }
      }));
    }

    // 4. Settlement Types
    if (this.settlementTypesCanvas && this.chartData.settlementTypes) {
      const data = this.chartData.settlementTypes;
      this.charts.push(new Chart(this.settlementTypesCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data) as number[],
            backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
          },
          cutout: '65%'
        }
      }));
    }

    // 5. Amount by Currency (Bar)
    if (this.amountByCurrencyCanvas && this.chartData.amountByCurrency) {
      const data = this.chartData.amountByCurrency;
      this.charts.push(new Chart(this.amountByCurrencyCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Total Amount (MYR)',
            data: Object.values(data) as number[],
            backgroundColor: ['#111', '#333', '#555', '#777', '#999'],
            borderRadius: 6,
            barThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } },
            x: { grid: { display: false } }
          }
        }
      }));
    }

    // 6. Top 5 Merchants (Bar) - Admin only
    if (this.topMerchantsCanvas && this.chartData.topMerchants) {
      const data = this.chartData.topMerchants;
      this.charts.push(new Chart(this.topMerchantsCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data).map(name => name.length > 20 ? name.substring(0, 20) + '…' : name),
          datasets: [{
            label: 'Transactions',
            data: Object.values(data) as number[],
            backgroundColor: '#111',
            borderRadius: 6,
            barThickness: 40
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } },
            y: { grid: { display: false } }
          }
        }
      }));
    }
  }
}