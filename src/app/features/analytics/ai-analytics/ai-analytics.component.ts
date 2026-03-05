import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService } from '../../../core/services/analytics-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-ai-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ai-analytics.component.html',
  styleUrls: ['./ai-analytics.component.css']
})
export class AiAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  userRole = '';
  activeTab: 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights' = 'overview';

  // Data
  overview: any = null;
  trends: any = null;
  scorecard: any[] = [];
  anomalies: any[] = [];
  insights: any[] = [];
  revenue: any = null;

  // Loading states
  overviewLoading = true;
  trendsLoading = true;
  scorecardLoading = true;
  anomaliesLoading = true;
  insightsLoading = true;
  revenueLoading = true;
  recomputing = false;

  // Charts
  private charts: Chart[] = [];

  @ViewChild('trendLineChart') trendLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendRevenueChart') trendRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('declineRateChart') declineRateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByChannelChart') revenueByChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByMerchantChart') revenueByMerchantCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyRevenueChart') monthlyRevenueCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private analyticsApi: AnalyticsApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.loadOverview();
    this.loadInsights();
    this.loadAnomalies();
  }

  ngAfterViewInit() {
    // Charts are rendered when tab is switched
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  switchTab(tab: 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights') {
    this.activeTab = tab;
    this.destroyCharts();

    if (tab === 'trends' && !this.trends) {
      this.loadTrends();
    }
    if (tab === 'scorecard' && this.scorecard.length === 0) {
      this.loadScorecard();
    }
    if (tab === 'overview' && !this.revenue) {
      this.loadRevenue();
    }
  }

  // ===== Data Loading =====

  loadOverview() {
    this.overviewLoading = true;
    this.analyticsApi.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.overviewLoading = false;
        this.loadRevenue();
      },
      error: () => { this.overviewLoading = false; }
    });
  }

  loadTrends() {
    this.trendsLoading = true;
    this.analyticsApi.getTrends().subscribe({
      next: (data) => {
        this.trends = data;
        this.trendsLoading = false;
        setTimeout(() => this.renderTrendCharts(), 100);
      },
      error: () => { this.trendsLoading = false; }
    });
  }

  loadScorecard() {
    this.scorecardLoading = true;
    this.analyticsApi.getScorecard().subscribe({
      next: (data) => {
        this.scorecard = data;
        this.scorecardLoading = false;
      },
      error: () => { this.scorecardLoading = false; }
    });
  }

  loadAnomalies() {
    this.anomaliesLoading = true;
    this.analyticsApi.getAnomalies().subscribe({
      next: (data) => {
        this.anomalies = data;
        this.anomaliesLoading = false;
      },
      error: () => { this.anomaliesLoading = false; }
    });
  }

  loadInsights() {
    this.insightsLoading = true;
    this.analyticsApi.getInsights().subscribe({
      next: (data) => {
        this.insights = data;
        this.insightsLoading = false;
      },
      error: () => { this.insightsLoading = false; }
    });
  }

  loadRevenue() {
    this.revenueLoading = true;
    this.analyticsApi.getRevenueBreakdown().subscribe({
      next: (data) => {
        this.revenue = data;
        this.revenueLoading = false;
        setTimeout(() => this.renderRevenueCharts(), 100);
      },
      error: () => { this.revenueLoading = false; }
    });
  }

  recompute() {
    this.recomputing = true;
    this.analyticsApi.recomputeAnalytics().subscribe({
      next: () => {
        this.recomputing = false;
        this.loadOverview();
        this.loadScorecard();
        this.loadAnomalies();
        this.loadInsights();
      },
      error: () => { this.recomputing = false; }
    });
  }

  // ===== Chart Rendering =====

  private renderTrendCharts() {
    if (!this.trends) return;

    // Daily transaction count trend
    if (this.trendLineCanvas && this.trends.dailyTransactionCounts) {
      const data = this.trends.dailyTransactionCounts;
      const labels = Object.keys(data).map(d => {
        const parts = d.split('-');
        return parts[2] + '/' + parts[1];
      });
      this.charts.push(new Chart(this.trendLineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Transactions',
            data: Object.values(data) as number[],
            borderColor: '#111',
            backgroundColor: 'rgba(17, 17, 17, 0.06)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#111',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
          }
        }
      }));
    }

    // Daily revenue trend
    if (this.trendRevenueCanvas && this.trends.dailyRevenue) {
      const data = this.trends.dailyRevenue;
      const labels = Object.keys(data).map(d => {
        const parts = d.split('-');
        return parts[2] + '/' + parts[1];
      });
      this.charts.push(new Chart(this.trendRevenueCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Revenue (MYR)',
            data: Object.values(data) as number[],
            backgroundColor: 'rgba(17, 17, 17, 0.75)',
            borderRadius: 3,
            barPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } },
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
          }
        }
      }));
    }

    // Weekly decline rate trend
    if (this.declineRateCanvas && this.trends.weeklyDeclineRate) {
      const data = this.trends.weeklyDeclineRate;
      this.charts.push(new Chart(this.declineRateCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Decline Rate %',
            data: Object.values(data) as number[],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => v + '%' }, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      }));
    }
  }

  private renderRevenueCharts() {
    if (!this.revenue) return;

    // Revenue by channel (doughnut)
    if (this.revenueByChannelCanvas && this.revenue.byChannel) {
      const data = this.revenue.byChannel;
      this.charts.push(new Chart(this.revenueByChannelCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{
            data: Object.values(data) as number[],
            backgroundColor: ['#111', '#333', '#555', '#777', '#999', '#bbb'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 11 } } }
          },
          cutout: '65%'
        }
      }));
    }

    // Top merchant revenue (horizontal bar)
    if (this.revenueByMerchantCanvas && this.revenue.byMerchant) {
      const data = this.revenue.byMerchant;
      this.charts.push(new Chart(this.revenueByMerchantCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data).map(n => n.length > 18 ? n.substring(0, 18) + '…' : n),
          datasets: [{
            label: 'Revenue (MYR)',
            data: Object.values(data) as number[],
            backgroundColor: '#111',
            borderRadius: 4,
            barThickness: 28
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() }, grid: { color: '#f0f0f0' } },
            y: { grid: { display: false } }
          }
        }
      }));
    }

    // Monthly revenue trend (bar)
    if (this.monthlyRevenueCanvas && this.revenue.monthlyRevenue) {
      const data = this.revenue.monthlyRevenue;
      this.charts.push(new Chart(this.monthlyRevenueCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Monthly Revenue (MYR)',
            data: Object.values(data) as number[],
            backgroundColor: ['#111', '#222', '#333', '#444', '#555', '#666'],
            borderRadius: 6,
            barThickness: 36
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } },
            x: { grid: { display: false } }
          }
        }
      }));
    }
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  // ===== Helpers =====

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'danger': return '🔴';
      case 'warning': return '🟡';
      case 'success': return '🟢';
      default: return '🔵';
    }
  }

  getRatingColor(rating: string): string {
    switch (rating) {
      case 'EXCELLENT': return '#22c55e';
      case 'GOOD': return '#3b82f6';
      case 'FAIR': return '#f59e0b';
      case 'AT_RISK': return '#ef4444';
      default: return '#888';
    }
  }

  getHealthBarColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'MYR 0.00';
    return 'MYR ' + num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatNumber(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  }

  formatPercent(value: number): string {
    if (value > 0) return '+' + value.toFixed(2) + '%';
    return value.toFixed(2) + '%';
  }
}
