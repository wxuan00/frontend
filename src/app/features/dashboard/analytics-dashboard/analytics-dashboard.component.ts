import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  activeTab: 'dashboard' | 'ai-analytics' = 'dashboard';

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

  // AI Model data
  rfmData: any = null;
  churnData: any = null;
  forecastData: any = null;
  rfmLoading = true;
  churnLoading = true;
  forecastLoading = true;

  // Accordion state for AI Models
  expandedModels: { [key: string]: boolean } = { rfm: true, churn: false, forecast: false };

  isModelExpanded(model: string): boolean {
    return !!this.expandedModels[model];
  }

  toggleModel(model: string) {
    const wasOpen = this.expandedModels[model];
    this.expandedModels[model] = !wasOpen;
    if (!wasOpen) {
      // Opening: render this model's charts after DOM is ready
      if (model === 'rfm' && this.rfmData) setTimeout(() => this.renderRfmChart(), 200);
      else if (model === 'churn' && this.churnData) setTimeout(() => this.renderShapCharts(), 200);
      else if (model === 'forecast' && this.forecastData) setTimeout(() => this.renderForecastChart(), 200);
    } else {
      // Closing: destroy only this model's charts
      this.destroyModelCharts(model);
    }
  }

  // XAI / SHAP state
  selectedCustomerIdx: number | null = null;
  rfmTips: { icon: string; title: string; message: string; severity: string }[] = [];
  churnTips: { icon: string; title: string; message: string; severity: string }[] = [];
  forecastTips: { icon: string; title: string; message: string; severity: string }[] = [];

  get selectedCustomer(): any {
    if (this.selectedCustomerIdx == null || !this.churnData?.predictions) return null;
    return this.churnData.predictions[this.selectedCustomerIdx];
  }

  private charts: Chart[] = [];
  private modelCharts: Map<string, Chart[]> = new Map();

  // Dashboard charts
  @ViewChild('txnStatusChart') txnStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyVolumeChart') dailyVolumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChannelChart') paymentChannelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('settlementTypesChart') settlementTypesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyRevenueChart') dailyRevenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topMerchantsChart') topMerchantsCanvas!: ElementRef<HTMLCanvasElement>;

  // AI model charts
  @ViewChild('rfmBarChart') rfmBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('forecastLineChart') forecastLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapImportanceChart') shapImportanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapWaterfallChart') shapWaterfallCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private analyticsApi: AnalyticsApiService,
    private reportService: ReportService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.userName = data.displayName || data.firstName || 'User';
      }
    });

    this.loadDashboardStats();

    // Auto-switch to AI Analytics tab if navigated via /ai-analytics route
    const tab = this.route.snapshot.data['tab'];
    if (tab === 'ai-analytics') {
      this.activeTab = 'ai-analytics';
      this.loadRfm();
      this.loadChurn();
      this.loadForecast();
    }
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

  switchTab(tab: 'dashboard' | 'ai-analytics') {
    this.activeTab = tab;
    this.destroyCharts();

    if (tab === 'dashboard') {
      setTimeout(() => this.renderDashboardCharts(), 50);
    }
    if (tab === 'ai-analytics') {
      if (!this.rfmData) this.loadRfm();
      if (!this.churnData) this.loadChurn();
      if (!this.forecastData) this.loadForecast();
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

  // ── Analytics Date Filter ─────────────────────────────────────
  filterFrom: string = '';
  filterTo:   string = '';
  filterApplied = false;

  onAnalyticsFilterChange() {
    if (this.filterFrom && this.filterTo && this.filterFrom > this.filterTo) return;
    this.applyDateFilter();
  }

  applyDateFilter() {
    if (this.filterFrom && this.filterTo && this.filterFrom > this.filterTo) {
      alert('⚠️ "From" date must be before "To" date.');
      return;
    }
    this.filterApplied = !!(this.filterFrom || this.filterTo);
    this.rfmData = null; this.churnData = null; this.forecastData = null;
    this.destroyCharts();
    this.loadRfm(); this.loadChurn(); this.loadForecast();
  }

  clearDateFilter() {
    this.filterFrom = ''; this.filterTo = ''; this.filterApplied = false;
    this.rfmData = null; this.churnData = null; this.forecastData = null;
    this.destroyCharts();
    this.loadRfm(); this.loadChurn(); this.loadForecast();
  }
  // ──────────────────────────────────────────────────────────────

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  }

  printReport() { window.print(); }

  exportAiAnalyticsCsv() {
    const rows: string[] = [];
    rows.push('AI Analytics Report — Generated ' + new Date().toISOString());
    rows.push('');

    // RFM Segmentation
    if (this.rfmData) {
      rows.push('=== RFM Customer Segmentation (K-Means) ===');
      rows.push(`Total Customers,${this.rfmData.totalCustomers}`);
      rows.push(`Clusters,${this.rfmData.clusterSummary?.length || 0}`);
      rows.push(`Silhouette Score,${this.rfmData.silhouetteScore ?? 'N/A'}`);
      rows.push('');
      rows.push('Segment,Customers,Avg Recency (days),Avg Frequency,Avg Monetary (MYR)');
      for (const seg of (this.rfmData.clusterSummary || [])) {
        rows.push(`${seg.label},${seg.count},${seg.avgRecency?.toFixed(1)},${seg.avgFrequency?.toFixed(1)},${seg.avgMonetary?.toFixed(2)}`);
      }
      rows.push('');
    }

    // Churn Prediction
    if (this.churnData) {
      rows.push('=== Customer Churn Prediction ===');
      rows.push(`High Risk Customers (>70%),${this.churnData.highRiskCount}`);
      rows.push(`Churn Rate,${this.churnData.churnRate}%`);
      rows.push(`Model Accuracy,${this.churnData.modelAccuracy != null ? (this.churnData.modelAccuracy * 100).toFixed(1) + '%' : 'N/A'}`);
      rows.push(`ROC-AUC,${this.churnData.rocAuc ?? 'N/A'}`);
      rows.push('');
      rows.push('Card (masked),Recency (days),Frequency,Monetary (MYR),Churn Probability,Risk Level');
      for (const p of (this.churnData.predictions || [])) {
        rows.push(`${this.maskCard(p.cardNo)},${p.recency},${p.frequency},${p.monetary?.toFixed(2)},${(p.churnProbability * 100).toFixed(1)}%,${this.getChurnRiskLabel(p.churnProbability)}`);
      }
      rows.push('');
    }

    // Forecast
    if (this.forecastData) {
      rows.push('=== Cash Flow Forecast (Prophet) ===');
      rows.push(`Predicted Revenue (next ${this.forecastData.horizonDays} days),${this.forecastData.totalPredicted?.toFixed(2)}`);
      rows.push(`Growth Trend,${this.forecastData.changePercent != null ? this.forecastData.changePercent.toFixed(2) + '%' : 'N/A'}`);
      rows.push(`Last Actual Date,${this.forecastData.lastActualDate}`);
      rows.push('');
      rows.push('Date,Actual Revenue,Forecast Revenue,Lower Bound,Upper Bound');
      for (const a of (this.forecastData.actual || [])) {
        rows.push(`${a.ds},${a.y?.toFixed(2)},,,`);
      }
      for (const f of (this.forecastData.forecast || [])) {
        rows.push(`${f.ds},,${f.yhat?.toFixed(2)},${f.yhat_lower?.toFixed(2)},${f.yhat_upper?.toFixed(2)}`);
      }
      rows.push('');
    }

    // Recommendations
    const allTips = [...this.rfmTips, ...this.churnTips, ...this.forecastTips];
    if (allTips.length > 0) {
      rows.push('=== AI Recommendations ===');
      rows.push('Category,Title,Recommendation');
      for (const tip of allTips) {
        rows.push(`${tip.severity},"${tip.title}","${tip.message.replace(/"/g, '""')}"`);
      }
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `ai-analytics-report-${new Date().toISOString().slice(0, 10)}.csv`);
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

    if (this.dailyRevenueCanvas && this.chartData.dailyRevenue) {
      const data = this.chartData.dailyRevenue;
      this.charts.push(new Chart(this.dailyRevenueCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Revenue (MYR)',
            data: Object.values(data) as number[],
            backgroundColor: '#111',
            borderRadius: 6,
            barPercentage: 0.55,
            categoryPercentage: 0.65
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } },
            x: { grid: { display: false } }
          }
        }
      }));
    }

    if (this.topMerchantsCanvas && this.chartData.topMerchants) {
      const data = this.chartData.topMerchants;
      this.charts.push(new Chart(this.topMerchantsCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data).map(name => name.length > 20 ? name.substring(0, 20) + '\u2026' : name),
          datasets: [{ label: 'Transactions', data: Object.values(data) as number[], backgroundColor: '#111', borderRadius: 6, barPercentage: 0.6, categoryPercentage: 0.7 }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f0f0' } }, y: { grid: { display: false } } }
        }
      }));
    }
  }

  private destroyModelCharts(model: string) {
    const owned = this.modelCharts.get(model) || [];
    owned.forEach(c => c.destroy());
    this.modelCharts.set(model, []);
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.modelCharts.forEach(charts => charts.forEach(c => c.destroy()));
    this.modelCharts.clear();
  }

  // ===== AI Model Loading =====

  private loadRfm() {
    this.rfmLoading = true;
    this.analyticsApi.getRfmSegments(this.filterFrom || undefined, this.filterTo || undefined).subscribe({
      next: (data) => {
        this.rfmData = data;
        this.rfmLoading = false;
        setTimeout(() => this.renderRfmChart(), 300);
        this.generateRfmTips();
      },
      error: () => { this.rfmLoading = false; }
    });
  }

  private loadChurn() {
    this.churnLoading = true;
    this.analyticsApi.getChurnRisk(90, this.filterFrom || undefined, this.filterTo || undefined).subscribe({
      next: (data) => {
        this.churnData = data;
        this.churnLoading = false;
        if (data?.predictions?.length > 0 && data.predictions[0].shapBreakdown) {
          this.selectedCustomerIdx = 0;
        }
        this.generateChurnTips();
        setTimeout(() => this.renderShapCharts(), 300);
      },
      error: () => { this.churnLoading = false; }
    });
  }

  private loadForecast() {
    this.forecastLoading = true;
    this.analyticsApi.getCashFlowForecast(30, this.filterFrom || undefined, this.filterTo || undefined).subscribe({
      next: (data) => {
        this.forecastData = data;
        this.forecastLoading = false;
        setTimeout(() => this.renderForecastChart(), 300);
        this.generateForecastTips();
      },
      error: () => { this.forecastLoading = false; }
    });
  }

  // ===== AI Chart Rendering =====

  private renderRfmChart(retries = 3) {
    if (!this.rfmData) return;
    if (!this.rfmBarCanvas) {
      if (retries > 0) setTimeout(() => this.renderRfmChart(retries - 1), 200);
      return;
    }
    const summary: any[] = this.rfmData.clusterSummary || [];
    if (summary.length === 0) return;

    const labels = summary.map((c: any) => c.label || `Cluster ${c.cluster}`);
    const counts = summary.map((c: any) => c.count || 0);
    const colors = ['#111111', '#3b82f6', '#f59e0b', '#ef4444', '#22c55e'];

    const rfmChart = new Chart(this.rfmBarCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Customers',
          data: counts,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 6,
          barPercentage: 0.5,
          categoryPercentage: 0.6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
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
    });
    this.modelCharts.set('rfm', [...(this.modelCharts.get('rfm') || []), rfmChart]);
  }

  private renderForecastChart(retries = 3) {
    if (!this.forecastData) return;
    if (!this.forecastLineCanvas) {
      if (retries > 0) setTimeout(() => this.renderForecastChart(retries - 1), 200);
      return;
    }
    const actual: any[] = this.forecastData.actual || [];
    const forecast: any[] = this.forecastData.forecast || [];
    if (actual.length === 0 && forecast.length === 0) return;

    const actualLabels = actual.map((d: any) => d.ds);
    const forecastLabels = forecast.map((d: any) => d.ds);
    const allLabels = [...actualLabels, ...forecastLabels];

    const actualValues = actual.map((d: any) => d.y);
    const actualPadded = [...actualValues, ...forecast.map(() => null)];
    const forecastValues = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat)];
    const upperBound = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat_upper)];
    const lowerBound = [...actual.map(() => null), ...forecast.map((d: any) => d.yhat_lower)];

    const forecastChart = new Chart(this.forecastLineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual Revenue', data: actualPadded,
            borderColor: '#111', backgroundColor: 'rgba(17,17,17,0.06)',
            borderWidth: 2, fill: false, tension: 0.3, pointRadius: 2, spanGaps: false
          },
          {
            label: 'Forecast (Prophet)', data: forecastValues,
            borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2, borderDash: [6, 3], fill: false, tension: 0.3, pointRadius: 2, spanGaps: false
          },
          {
            label: 'Upper Bound', data: upperBound,
            borderColor: 'rgba(59,130,246,0.2)', backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 1, fill: '-1', tension: 0.3, pointRadius: 0, spanGaps: false
          },
          {
            label: 'Lower Bound', data: lowerBound,
            borderColor: 'rgba(59,130,246,0.2)', backgroundColor: 'rgba(59,130,246,0.05)',
            borderWidth: 1, fill: false, tension: 0.3, pointRadius: 0, spanGaps: false
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { filter: (item) => item.text !== 'Lower Bound' && item.text !== 'Upper Bound' } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: (v) => 'RM ' + Number(v).toLocaleString() } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 }, maxTicksLimit: 20 } }
        }
      }
    });
    this.modelCharts.set('forecast', [...(this.modelCharts.get('forecast') || []), forecastChart]);
  }

  // ===== SHAP / XAI =====

  selectCustomerForXAI(idx: number) {
    this.selectedCustomerIdx = idx;
    setTimeout(() => this.renderWaterfallChart(), 50);
  }

  getSortedImportance(importance: Record<string, number>): { key: string; value: number }[] {
    return Object.entries(importance)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  getFeatureColor(key: string): string {
    const colors: Record<string, string> = {
      Recency: '#111111',
      Frequency: '#3b82f6',
      Monetary: '#f59e0b',
    };
    return colors[key] ?? '#888';
  }

  getShapBarWidth(value: number): number {
    const imp = this.churnData?.globalFeatureImportance;
    if (!imp) return 0;
    const max = Math.max(...Object.values(imp).map((v: any) => Math.abs(v)), 0.0001);
    return Math.min((Math.abs(value) / max) * 100, 100);
  }

  getFeatureExplanation(key: string, value: number): string {
    const positive = value > 0;
    switch (key) {
      case 'Recency':
        return positive ? 'Long time since last purchase' : 'Purchased recently';
      case 'Frequency':
        return positive ? 'Low number of purchases' : 'Buys frequently';
      case 'Monetary':
        return positive ? 'Low total spending' : 'High total spending';
      default:
        return key;
    }
  }

  // ===== SHAP Chart Rendering (Chart.js) =====

  private renderShapCharts(retries = 3) {
    if (!this.churnData?.globalFeatureImportance) return;
    if (!this.shapImportanceCanvas) {
      if (retries > 0) setTimeout(() => this.renderShapCharts(retries - 1), 200);
      return;
    }
    this.renderGlobalImportanceChart();
    if (this.selectedCustomer?.shapBreakdown) {
      this.renderWaterfallChart();
    }
  }

  private renderGlobalImportanceChart() {
    if (!this.churnData?.globalFeatureImportance || !this.shapImportanceCanvas) return;
    const imp = this.churnData.globalFeatureImportance;
    const entries = Object.entries(imp).sort((a: any, b: any) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    const values = entries.map(e => e[1] as number);
    const colors = labels.map(l => this.getFeatureColor(l));
    const shapChart = new Chart(this.shapImportanceCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Mean |SHAP|',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          barPercentage: 0.5,
          categoryPercentage: 0.6
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
    });
    this.modelCharts.set('churn', [...(this.modelCharts.get('churn') || []), shapChart]);
  }

  private renderWaterfallChart() {
    if (!this.selectedCustomer?.shapBreakdown || !this.shapWaterfallCanvas) return;
    // Destroy the previous waterfall chart only
    const churnCharts = this.modelCharts.get('churn') || [];
    const existingIdx = churnCharts.findIndex(c => (c as any).__shapWaterfall);
    if (existingIdx >= 0) { churnCharts[existingIdx].destroy(); churnCharts.splice(existingIdx, 1); }
    const breakdown = this.selectedCustomer.shapBreakdown;
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
          barPercentage: 0.5,
          categoryPercentage: 0.6
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
              afterLabel: (ctx) => (ctx.raw as number) > 0 ? '↑ Increases churn risk' : '↓ Decreases churn risk'
            }
          }
        },
        scales: {
          x: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'SHAP value (contribution to prediction)', font: { size: 11 } } },
          y: { grid: { display: false } }
        }
      }
    });
    (chart as any).__shapWaterfall = true;
    const churnCharts2 = this.modelCharts.get('churn') || [];
    churnCharts2.push(chart);
    this.modelCharts.set('churn', churnCharts2);
  }

  // ===== Per-Model Sales Boost Recommendation Engines =====

  private generateRfmTips() {
    const tips: { icon: string; title: string; message: string; severity: string }[] = [];
    if (!this.rfmData?.clusterSummary) { this.rfmTips = tips; return; }

    const summary: any[] = this.rfmData.clusterSummary;
    const totalCustomers = this.rfmData.totalCustomers || 1;

    const champions = summary.find((s: any) => s.label === 'Champions');
    const loyal = summary.find((s: any) => s.label === 'Loyal Customers');
    const atRisk = summary.find((s: any) => s.label === 'At Risk');
    const lost = summary.find((s: any) => s.label === 'Lost Customers');

    if (champions) {
      const pct = ((champions.count / totalCustomers) * 100).toFixed(0);
      tips.push({
        icon: '🏆', severity: 'success',
        title: 'Leverage Your Champions',
        message: `${champions.count} customers (${pct}%) are Champions — recent, frequent, high-spend buyers. Launch a referral program: offer them exclusive rewards for bringing in new customers. Champions have the highest lifetime value and can become brand ambassadors.`,
      });
    }

    if (loyal) {
      const pct = ((loyal.count / totalCustomers) * 100).toFixed(0);
      tips.push({
        icon: '🎯', severity: 'info',
        title: 'Upsell to Loyal Customers',
        message: `${loyal.count} Loyal Customers (${pct}%) transact regularly but may not be spending at their full potential. Introduce bundle offers, cross-sell complementary products, or create a tiered loyalty program to increase average order value.`,
      });
    }

    if (atRisk && atRisk.count > 0) {
      const pct = ((atRisk.count / totalCustomers) * 100).toFixed(0);
      tips.push({
        icon: '⚠️', severity: 'warning',
        title: 'Re-Engage At-Risk Customers',
        message: `${atRisk.count} customers (${pct}%) are At Risk — previously active but fading. Send personalized win-back campaigns with limited-time discounts. Act within 7 days of detecting inactivity for maximum recovery rate.`,
      });
    }

    if (lost && lost.count > 0) {
      const pct = ((lost.count / totalCustomers) * 100).toFixed(0);
      tips.push({
        icon: '📧', severity: 'danger',
        title: 'Win Back Lost Customers',
        message: `${lost.count} Lost Customers (${pct}%) haven't transacted recently. Consider a high-value incentive (20-30% off) in a "We miss you" campaign. Reactivating just 10% of lost customers could recover significant revenue.`,
      });
    }

    if (tips.length === 0) {
      tips.push({
        icon: '✅', severity: 'success',
        title: 'Customer Base Looks Healthy',
        message: `All ${totalCustomers} customers are actively engaged. Keep up the great work! Consider introducing loyalty tiers to reward consistent buyers and prevent future churn.`,
      });
    }

    this.rfmTips = tips;
  }

  private generateChurnTips() {
    const tips: { icon: string; title: string; message: string; severity: string }[] = [];
    if (!this.churnData) { this.churnTips = tips; return; }

    const highRisk = this.churnData.highRiskCount || 0;
    const total = this.churnData.totalCustomers || 1;
    const churnRate = this.churnData.churnRate || 0;
    const predictions = this.churnData.predictions || [];

    if (highRisk > 0) {
      // Find the top high-risk customers for specific action
      const topRisk = predictions.filter((p: any) => p.churnProbability > 0.7).slice(0, 3);
      const cardList = topRisk.map((p: any) => `****${p.cardNo.slice(-4)}`).join(', ');
      tips.push({
        icon: '🔥', severity: 'danger',
        title: `${highRisk} High-Risk Customer${highRisk > 1 ? 's' : ''} Detected`,
        message: `Cards ${cardList} have >70% churn probability. Each lost customer costs ~5× more to replace than to retain. Immediate action: send personalized retention offers (e.g., exclusive discounts, free shipping, loyalty points bonus) to these accounts within 48 hours.`,
      });
    }

    if (churnRate > 20) {
      tips.push({
        icon: '🚨', severity: 'danger',
        title: `High Churn Rate: ${churnRate.toFixed(1)}%`,
        message: `More than 1 in 5 customers are likely to stop transacting. This signals a systemic issue — review your pricing, service quality, and competitor activity. Consider a customer satisfaction survey to identify pain points.`,
      });
    } else if (churnRate > 10) {
      tips.push({
        icon: '⚠️', severity: 'warning',
        title: `Moderate Churn Rate: ${churnRate.toFixed(1)}%`,
        message: `About ${Math.round(churnRate)}% of customers show churn signals. Implement automated re-engagement emails triggered by inactivity milestones (14, 21, 30 days).`,
      });
    } else if (churnRate > 0) {
      tips.push({
        icon: '✅', severity: 'success',
        title: `Low Churn Rate: ${churnRate.toFixed(1)}%`,
        message: `Customer retention is strong. Focus on maintaining service quality and proactively reaching out to the few at-risk customers before they disengage.`,
      });
    }

    // SHAP-driven recommendation
    if (this.churnData.globalFeatureImportance) {
      const imp = this.churnData.globalFeatureImportance;
      const sorted = Object.entries(imp).sort((a: any, b: any) => b[1] - a[1]);
      const topFeature = sorted[0]?.[0];

      const featureTips: Record<string, { title: string; message: string }> = {
        Recency: {
          title: 'AI Insight: "Recency" Is the #1 Churn Driver',
          message: 'Customers who haven\'t transacted recently are most at risk. Set up automated re-engagement at 14, 21, and 30 days of inactivity with escalating incentives (5% → 10% → 15% off).',
        },
        Frequency: {
          title: 'AI Insight: "Frequency" Is the #1 Churn Driver',
          message: 'Customers with fewer transactions are most likely to churn. Implement transaction-based rewards ("Every 5th purchase gets 15% off") and subscription models to boost repeat purchases.',
        },
        Monetary: {
          title: 'AI Insight: "Spending Level" Is the #1 Churn Driver',
          message: 'Lower spenders are more likely to leave. Create a VIP tier for top spenders with dedicated support and upsell low-spend customers with bundles and cross-sells.',
        },
      };

      if (topFeature && featureTips[topFeature]) {
        tips.push({
          icon: '🔍', severity: 'info',
          ...featureTips[topFeature],
        });
      }
    }

    if (tips.length === 0) {
      tips.push({
        icon: '✅', severity: 'success',
        title: 'No Significant Churn Risk',
        message: `The AI model doesn't detect any high-risk churn patterns. Keep monitoring regularly to catch early warning signs.`,
      });
    }

    this.churnTips = tips;
  }

  private generateForecastTips() {
    const tips: { icon: string; title: string; message: string; severity: string }[] = [];
    if (!this.forecastData) { this.forecastTips = tips; return; }

    const changePct = this.forecastData.changePercent;
    const totalPredicted = this.forecastData.totalPredicted;
    const horizon = this.forecastData.horizonDays || 30;
    const formattedRevenue = totalPredicted?.toLocaleString('en-MY', { minimumFractionDigits: 2 });

    if (changePct != null && changePct < -10) {
      tips.push({
        icon: '📉', severity: 'danger',
        title: `Sharp Revenue Decline Expected (${changePct.toFixed(1)}%)`,
        message: `Revenue is forecasted to drop significantly over the next ${horizon} days to ~MYR ${formattedRevenue}. Urgent actions: launch a flash sale campaign, reactivate dormant customers, or introduce a new product line to counteract the decline.`,
      });
    } else if (changePct != null && changePct < -2) {
      tips.push({
        icon: '📉', severity: 'warning',
        title: `Slight Revenue Dip Expected (${changePct.toFixed(1)}%)`,
        message: `A small revenue decline is forecasted over the next ${horizon} days. This is normal seasonality in many businesses. Consider a modest promotional campaign to offset the dip. Projected: MYR ${formattedRevenue}.`,
      });
    } else if (changePct != null && changePct > 15) {
      tips.push({
        icon: '🚀', severity: 'success',
        title: `Strong Growth Ahead (+${changePct.toFixed(1)}%)`,
        message: `Revenue is forecasted to grow significantly over the next ${horizon} days. Capitalize: increase inventory, scale marketing spend, and onboard new merchants. Projected: MYR ${formattedRevenue}.`,
      });
    } else if (changePct != null && changePct > 2) {
      tips.push({
        icon: '📈', severity: 'success',
        title: `Healthy Growth Expected (+${changePct.toFixed(1)}%)`,
        message: `Steady revenue growth is forecasted. Maintain current strategies while exploring new customer acquisition channels. Projected: MYR ${formattedRevenue}.`,
      });
    } else if (changePct != null) {
      tips.push({
        icon: '📊', severity: 'info',
        title: `Stable Revenue Outlook (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`,
        message: `Revenue is expected to remain stable over the next ${horizon} days (~MYR ${formattedRevenue}). Focus on operational efficiency and long-term growth — customer retention and acquisition cost optimization.`,
      });
    }

    this.forecastTips = tips;
  }

  // ===== Helpers =====

  getShapSorted(breakdown: Record<string, number>): { key: string; value: number }[] {
    return Object.entries(breakdown)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
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

  maskCard(cardNo: string): string {
    if (!cardNo) return '-';
    const digits = cardNo.replace(/\s/g, '');
    if (digits.length < 4) return cardNo;
    return '**** **** **** ' + digits.slice(-4);
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
