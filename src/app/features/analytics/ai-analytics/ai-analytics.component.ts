import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
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
  activeTab: 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights' | 'models' = 'overview';

  // Data
  overview: any = null;
  trends: any = null;
  scorecard: any[] = [];
  anomalies: any[] = [];
  insights: any[] = [];
  revenue: any = null;

  // AI Model Data
  rfmData: any = null;
  churnData: any = null;
  forecastData: any = null;

  // Loading states
  overviewLoading = true;
  trendsLoading = true;
  scorecardLoading = true;
  anomaliesLoading = true;
  insightsLoading = true;
  revenueLoading = true;
  rfmLoading = true;
  churnLoading = true;
  forecastLoading = true;
  recomputing = false;

  // Charts
  private charts: Chart[] = [];

  @ViewChild('trendLineChart') trendLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendRevenueChart') trendRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('declineRateChart') declineRateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByChannelChart') revenueByChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueByMerchantChart') revenueByMerchantCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyRevenueChart') monthlyRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rfmBarChart') rfmBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('forecastLineChart') forecastLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapImportanceChart') shapImportanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapWaterfallChart') shapWaterfallCanvas!: ElementRef<HTMLCanvasElement>;

  // XAI state
  selectedCustomerIdx: number | null = null;
  get selectedCustomer(): any {
    if (this.selectedCustomerIdx == null || !this.churnData?.predictions) return null;
    return this.churnData.predictions[this.selectedCustomerIdx];
  }

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

  switchTab(tab: 'overview' | 'trends' | 'scorecard' | 'anomalies' | 'insights' | 'models') {
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
    if (tab === 'models') {
      if (!this.rfmData) this.loadRfm();
      if (!this.churnData) this.loadChurn();
      if (!this.forecastData) this.loadForecast();
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

  loadRfm() {
    this.rfmLoading = true;
    this.analyticsApi.getRfmSegments().subscribe({
      next: (data) => {
        this.rfmData = data;
        this.rfmLoading = false;
        setTimeout(() => this.renderRfmChart(), 100);
      },
      error: () => { this.rfmLoading = false; }
    });
  }

  loadChurn() {
    this.churnLoading = true;
    this.analyticsApi.getChurnRisk().subscribe({
      next: (data) => {
        this.churnData = data;
        this.churnLoading = false;
        // Auto-select highest-risk customer for SHAP waterfall
        if (data?.predictions?.length > 0 && data.predictions[0].shapBreakdown) {
          this.selectedCustomerIdx = 0;
        }
        setTimeout(() => this.renderShapCharts(), 100);
      },
      error: () => { this.churnLoading = false; }
    });
  }

  loadForecast() {
    this.forecastLoading = true;
    this.analyticsApi.getCashFlowForecast().subscribe({
      next: (data) => {
        this.forecastData = data;
        this.forecastLoading = false;
        setTimeout(() => this.renderForecastChart(), 100);
      },
      error: () => { this.forecastLoading = false; }
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

  private renderRfmChart() {
    if (!this.rfmData || !this.rfmBarCanvas) return;
    const summary: any[] = this.rfmData.clusterSummary || [];
    if (summary.length === 0) return;

    const labels = summary.map((c: any) => c.label || `Cluster ${c.cluster}`);
    const counts = summary.map((c: any) => c.count || 0);
    const colors = ['#111111', '#3b82f6', '#f59e0b', '#ef4444', '#22c55e'];

    this.charts.push(new Chart(this.rfmBarCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Customers',
          data: counts,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 6,
          barThickness: 44
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const seg = summary[ctx.dataIndex];
                return [
                  `Avg Recency: ${seg.avgRecency} days`,
                  `Avg Frequency: ${seg.avgFrequency} txns`,
                  `Avg Monetary: MYR ${seg.avgMonetary?.toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    }));
  }

  private renderForecastChart() {
    if (!this.forecastData || !this.forecastLineCanvas) return;
    const actual: any[] = this.forecastData.actual || [];
    const forecast: any[] = this.forecastData.forecast || [];
    if (actual.length === 0 && forecast.length === 0) return;

    const actualLabels = actual.map((d: any) => d.ds);
    const forecastLabels = forecast.map((d: any) => d.ds);
    const allLabels = [...actualLabels, ...forecastLabels];

    const actualValues = actual.map((d: any) => d.y);
    // Pad actual with nulls for forecast portion
    const actualPadded = [...actualValues, ...forecast.map(() => null)];
    const forecastValues = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat)];
    const upperBound = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat_upper)];
    const lowerBound = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat_lower)];

    this.charts.push(new Chart(this.forecastLineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual Revenue',
            data: actualPadded,
            borderColor: '#111',
            backgroundColor: 'rgba(17,17,17,0.06)',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
          },
          {
            label: 'Forecast (Prophet)',
            data: forecastValues,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2,
            borderDash: [6, 3],
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            spanGaps: false
          },
          {
            label: 'Upper Bound',
            data: upperBound,
            borderColor: 'rgba(59,130,246,0.2)',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 1,
            fill: '-1',
            tension: 0.3,
            pointRadius: 0,
            spanGaps: false
          },
          {
            label: 'Lower Bound',
            data: lowerBound,
            borderColor: 'rgba(59,130,246,0.2)',
            backgroundColor: 'rgba(59,130,246,0.05)',
            borderWidth: 1,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            spanGaps: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { filter: (item) => item.text !== 'Lower Bound' && item.text !== 'Upper Bound' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f0f0f0' },
            ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() }
          },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 }, maxTicksLimit: 20 } }
        }
      }
    }));
  }

  // ===== SHAP / XAI Charts =====

  selectCustomerForXAI(idx: number) {
    this.selectedCustomerIdx = idx;
    setTimeout(() => this.renderWaterfallChart(), 50);
  }

  private renderShapCharts() {
    this.renderGlobalImportanceChart();
    this.renderWaterfallChart();
  }

  private renderGlobalImportanceChart() {
    if (!this.churnData?.globalFeatureImportance || !this.shapImportanceCanvas) return;
    const imp = this.churnData.globalFeatureImportance;
    const entries = Object.entries(imp).sort((a: any, b: any) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    const values = entries.map(e => e[1] as number);

    this.charts.push(new Chart(this.shapImportanceCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Mean |SHAP|',
          data: values,
          backgroundColor: ['#111', '#3b82f6', '#f59e0b'],
          borderRadius: 6,
          barThickness: 38
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f0f0f0' }, title: { display: true, text: 'Mean |SHAP value| (impact on model output)', font: { size: 11 } } },
          y: { grid: { display: false } }
        }
      }
    }));
  }

  private renderWaterfallChart() {
    if (!this.selectedCustomer?.shapBreakdown || !this.shapWaterfallCanvas) return;
    // Destroy previous waterfall chart if it exists
    const existing = this.charts.findIndex(c => (c as any).__shapWaterfall);
    if (existing >= 0) { this.charts[existing].destroy(); this.charts.splice(existing, 1); }

    const breakdown = this.selectedCustomer.shapBreakdown;
    const baseValue = this.churnData.shapBaseValue ?? 0;
    const entries = Object.entries(breakdown).sort((a: any, b: any) => Math.abs(b[1]) - Math.abs(a[1]));
    const labels = entries.map(e => e[0]);
    const values = entries.map(e => e[1] as number);
    const colors = values.map(v => v > 0 ? '#ef4444' : '#22c55e');

    const chart = new Chart(this.shapWaterfallCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'SHAP Value',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 38
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const val = ctx.raw as number;
                return val > 0 ? '↑ Increases churn risk' : '↓ Decreases churn risk';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#f0f0f0' },
            title: { display: true, text: 'SHAP value (contribution to prediction)', font: { size: 11 } }
          },
          y: { grid: { display: false } }
        }
      }
    });
    (chart as any).__shapWaterfall = true;
    this.charts.push(chart);
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

  getChurnRiskColor(prob: number): string {
    if (prob >= 0.7) return '#ef4444';
    if (prob >= 0.4) return '#f59e0b';
    return '#22c55e';
  }

  getChurnRiskLabel(prob: number): string {
    if (prob >= 0.7) return 'High Risk';
    if (prob >= 0.4) return 'Medium Risk';
    return 'Low Risk';
  }

  getClusterColor(label: string): string {
    switch (label) {
      case 'Champions': return '#111111';
      case 'Loyal Customers': return '#3b82f6';
      case 'At Risk': return '#f59e0b';
      case 'Lost Customers': return '#ef4444';
      default: return '#888';
    }
  }

  getShapSorted(breakdown: Record<string, number>): { key: string; value: number }[] {
    return Object.entries(breakdown)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  maskCard(cardNo: string): string {
    if (!cardNo) return '-';
    const digits = cardNo.replace(/\s/g, '');
    if (digits.length < 4) return cardNo;
    return '**** **** **** ' + digits.slice(-4);
  }
}
