import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AnalyticsApiService } from '../../../core/services/analytics-api.service';
import { ReportService } from '../../../core/services/report.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  userRole: string = '';
  userName: string = '';

  // Active tab
  activeTab: 'dashboard' | 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights' | 'reports' = 'dashboard';

  // Report data
  report: any = null;
  reportLoading = false;
  reportError = '';
  merchantBreakdown: { label: string; value: number; color: string; percent: number }[] = [];
  transactionBreakdown: { label: string; value: number; color: string; percent: number }[] = [];

  // Dashboard stats
  totalUsers: number = 0;
  totalMerchants: number = 0;
  activeMerchants: number = 0;
  pendingMerchants: number = 0;
  totalTransactions: number = 0;
  totalSettlements: number = 0;
  recentUsers: any[] = [];
  chartsLoading = true;
  chartData: any = null;

  // AI Analytics data
  aiOverview: any = null;
  trends: any = null;
  scorecard: any[] = [];
  anomalies: any[] = [];
  insights: any[] = [];
  revenue: any = null;

  // AI loading states
  overviewLoading = true;
  trendsLoading = true;
  scorecardLoading = true;
  anomaliesLoading = true;
  insightsLoading = true;
  revenueLoading = true;
  recomputing = false;

  private charts: Chart[] = [];

  // Dashboard charts
  @ViewChild('txnStatusChart') txnStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyVolumeChart') dailyVolumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChannelChart') paymentChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('settlementTypesChart') settlementTypesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amountByCurrencyChart') amountByCurrencyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topMerchantsChart') topMerchantsCanvas!: ElementRef<HTMLCanvasElement>;

  // AI Analytics charts
  @ViewChild('trendLineChart') trendLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendRevenueChart') trendRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('declineRateChart') declineRateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByChannelChart') revenueByChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByMerchantChart') revenueByMerchantCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyRevenueChart') monthlyRevenueCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private analyticsApi: AnalyticsApiService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userName = data.firstName || data.displayName || 'User';
      }
    });

    this.loadDashboardStats();
    this.loadAiOverview();
    this.loadTrends();
    this.loadScorecard();
    this.loadAnomalies();
    this.loadInsights();
    this.loadRevenue();
  }

  ngAfterViewInit() {
    this.dashboardService.getChartData().subscribe({
      next: (data) => {
        this.chartData = data;
        this.chartsLoading = false;
        setTimeout(() => this.renderDashboardCharts(), 50);
      },
      error: () => {
        this.chartsLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  // ===== Tab Switching =====

  switchTab(tab: 'dashboard' | 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights' | 'reports') {
    this.activeTab = tab;
    this.destroyCharts();

    if (tab === 'dashboard') {
      setTimeout(() => this.renderDashboardCharts(), 50);
    }
    if (tab === 'overview') {
      setTimeout(() => this.renderRevenueCharts(), 50);
    }
    if (tab === 'trends') {
      setTimeout(() => this.renderTrendCharts(), 50);
    }
    if (tab === 'reports' && !this.report && !this.reportLoading) {
      this.loadReport();
    }
  }

  // ===== Dashboard Data =====

  private loadDashboardStats() {
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

  // ===== AI Analytics Data =====

  loadAiOverview() {
    this.overviewLoading = true;
    this.analyticsApi.getOverview().subscribe({
      next: (data) => {
        this.aiOverview = data;
        this.overviewLoading = false;
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
      },
      error: () => { this.revenueLoading = false; }
    });
  }

  loadReport() {
    this.reportLoading = true;
    this.reportError = '';
    this.reportService.getSummaryReport().subscribe({
      next: (data) => {
        this.report = data;
        this.buildReportChartData();
        this.reportLoading = false;
      },
      error: () => {
        this.reportError = 'Failed to load report data.';
        this.reportLoading = false;
      }
    });
  }

  private buildReportChartData() {
    if (!this.report) return;
    if (this.userRole === 'ADMIN') {
      const totalM = (this.report.activeMerchants || 0) + (this.report.pendingMerchants || 0) + (this.report.suspendedMerchants || 0);
      if (totalM > 0) {
        this.merchantBreakdown = [
          { label: 'Active', value: this.report.activeMerchants || 0, color: '#22c55e', percent: Math.round(((this.report.activeMerchants || 0) / totalM) * 100) },
          { label: 'Pending', value: this.report.pendingMerchants || 0, color: '#f59e0b', percent: Math.round(((this.report.pendingMerchants || 0) / totalM) * 100) },
          { label: 'Suspended', value: this.report.suspendedMerchants || 0, color: '#ef4444', percent: Math.round(((this.report.suspendedMerchants || 0) / totalM) * 100) }
        ];
      }
    }
    const totalT = (this.report.approvedTransactions || 0) + (this.report.pendingTransactions || 0) + (this.report.declinedTransactions || 0);
    if (totalT > 0) {
      this.transactionBreakdown = [
        { label: 'Approved', value: this.report.approvedTransactions || 0, color: '#22c55e', percent: Math.round(((this.report.approvedTransactions || 0) / totalT) * 100) },
        { label: 'Pending', value: this.report.pendingTransactions || 0, color: '#f59e0b', percent: Math.round(((this.report.pendingTransactions || 0) / totalT) * 100) },
        { label: 'Declined', value: this.report.declinedTransactions || 0, color: '#ef4444', percent: Math.round(((this.report.declinedTransactions || 0) / totalT) * 100) }
      ];
    }
  }

  exportSummaryCsv() {
    this.reportService.exportSummaryReportCsv().subscribe({
      next: (blob) => this.downloadFile(blob, 'summary-report.csv'),
      error: () => {}
    });
  }

  exportTransactionsCsv() {
    this.reportService.exportTransactionsCsv().subscribe({
      next: (blob) => this.downloadFile(blob, 'transactions-export.csv'),
      error: () => {}
    });
  }

  exportSettlementsCsv() {
    this.reportService.exportSettlementsCsv().subscribe({
      next: (blob) => this.downloadFile(blob, 'settlements-export.csv'),
      error: () => {}
    });
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  }

  printReport() { window.print(); }

  formatReportDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  recompute() {
    this.recomputing = true;
    this.analyticsApi.recomputeAnalytics().subscribe({
      next: () => {
        this.recomputing = false;
        this.aiOverview = null;
        this.trends = null;
        this.scorecard = [];
        this.loadAiOverview();
        this.loadTrends();
        this.loadScorecard();
        this.loadAnomalies();
        this.loadInsights();
        this.loadRevenue();
      },
      error: () => { this.recomputing = false; }
    });
  }

  // ===== Dashboard Chart Rendering =====

  private renderDashboardCharts() {
    if (!this.chartData) return;

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
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
          cutout: '65%'
        }
      }));
    }

    if (this.dailyVolumeCanvas && this.chartData.dailyTransactionVolume) {
      const data = this.chartData.dailyTransactionVolume;
      this.charts.push(new Chart(this.dailyVolumeCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Transactions', data: Object.values(data) as number[],
            borderColor: '#111', backgroundColor: 'rgba(17, 17, 17, 0.08)',
            fill: true, tension: 0.4, pointBackgroundColor: '#111',
            pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
        }
      }));
    }

    if (this.paymentChannelCanvas && this.chartData.paymentChannelDistribution) {
      const data = this.chartData.paymentChannelDistribution;
      this.charts.push(new Chart(this.paymentChannelCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{ data: Object.values(data) as number[], backgroundColor: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f59e0b'], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
          cutout: '65%'
        }
      }));
    }

    if (this.settlementTypesCanvas && this.chartData.settlementTypes) {
      const data = this.chartData.settlementTypes;
      this.charts.push(new Chart(this.settlementTypesCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{ data: Object.values(data) as number[], backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
          cutout: '65%'
        }
      }));
    }

    if (this.amountByCurrencyCanvas && this.chartData.amountByCurrency) {
      const data = this.chartData.amountByCurrency;
      this.charts.push(new Chart(this.amountByCurrencyCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{ label: 'Total Amount (MYR)', data: Object.values(data) as number[], backgroundColor: ['#111', '#333', '#555', '#777', '#999'], borderRadius: 6, barThickness: 40 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } }, x: { grid: { display: false } } }
        }
      }));
    }

    if (this.topMerchantsCanvas && this.chartData.topMerchants) {
      const data = this.chartData.topMerchants;
      this.charts.push(new Chart(this.topMerchantsCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data).map(name => name.length > 20 ? name.substring(0, 20) + '\u2026' : name),
          datasets: [{ label: 'Transactions', data: Object.values(data) as number[], backgroundColor: '#111', borderRadius: 6, barThickness: 40 }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } }, y: { grid: { display: false } } }
        }
      }));
    }
  }

  // ===== AI Trend Chart Rendering =====

  private renderTrendCharts() {
    if (!this.trends) return;

    if (this.trendLineCanvas && this.trends.dailyTransactionCounts) {
      const data = this.trends.dailyTransactionCounts;
      const labels = Object.keys(data).map(d => { const p = d.split('-'); return p[2] + '/' + p[1]; });
      this.charts.push(new Chart(this.trendLineCanvas.nativeElement, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Transactions', data: Object.values(data) as number[], borderColor: '#111', backgroundColor: 'rgba(17,17,17,0.06)', fill: true, tension: 0.4, pointBackgroundColor: '#111', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } }, x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } } } }
      }));
    }

    if (this.trendRevenueCanvas && this.trends.dailyRevenue) {
      const data = this.trends.dailyRevenue;
      const labels = Object.keys(data).map(d => { const p = d.split('-'); return p[2] + '/' + p[1]; });
      this.charts.push(new Chart(this.trendRevenueCanvas.nativeElement, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Revenue (MYR)', data: Object.values(data) as number[], backgroundColor: 'rgba(17,17,17,0.75)', borderRadius: 3, barPercentage: 0.7 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } }, x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } } } }
      }));
    }

    if (this.declineRateCanvas && this.trends.weeklyDeclineRate) {
      const data = this.trends.weeklyDeclineRate;
      this.charts.push(new Chart(this.declineRateCanvas.nativeElement, {
        type: 'line',
        data: { labels: Object.keys(data), datasets: [{ label: 'Decline Rate %', data: Object.values(data) as number[], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#ef4444', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + '%' }, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } } }
      }));
    }
  }

  private renderRevenueCharts() {
    if (!this.revenue) return;

    if (this.revenueByChannelCanvas && this.revenue.byChannel) {
      const data = this.revenue.byChannel;
      this.charts.push(new Chart(this.revenueByChannelCanvas.nativeElement, {
        type: 'doughnut',
        data: { labels: Object.keys(data), datasets: [{ data: Object.values(data) as number[], backgroundColor: ['#111', '#333', '#555', '#777', '#999', '#bbb'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 11 } } } }, cutout: '65%' }
      }));
    }

    if (this.revenueByMerchantCanvas && this.revenue.byMerchant) {
      const data = this.revenue.byMerchant;
      this.charts.push(new Chart(this.revenueByMerchantCanvas.nativeElement, {
        type: 'bar',
        data: { labels: Object.keys(data).map(n => n.length > 18 ? n.substring(0, 18) + '\u2026' : n), datasets: [{ label: 'Revenue (MYR)', data: Object.values(data) as number[], backgroundColor: '#111', borderRadius: 4, barThickness: 28 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() }, grid: { color: '#f0f0f0' } }, y: { grid: { display: false } } } }
      }));
    }

    if (this.monthlyRevenueCanvas && this.revenue.monthlyRevenue) {
      const data = this.revenue.monthlyRevenue;
      this.charts.push(new Chart(this.monthlyRevenueCanvas.nativeElement, {
        type: 'bar',
        data: { labels: Object.keys(data), datasets: [{ label: 'Monthly Revenue (MYR)', data: Object.values(data) as number[], backgroundColor: ['#111', '#222', '#333', '#444', '#555', '#666'], borderRadius: 6, barThickness: 36 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } }, x: { grid: { display: false } } } }
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
      case 'danger': return '\U0001F534';
      case 'warning': return '\U0001F7E1';
      case 'success': return '\U0001F7E2';
      default: return '\U0001F535';
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
