import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-summary-report',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './summary-report.component.html',
  styleUrls: ['./summary-report.component.css']
})
export class SummaryReportComponent implements OnInit {
  report: any = null;
  loading = false;
  isAdmin = false;
  errorMessage = '';

  // Computed chart data
  merchantBreakdown: { label: string; value: number; color: string; percent: number }[] = [];
  transactionBreakdown: { label: string; value: number; color: string; percent: number }[] = [];

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reportService.getSummaryReport().subscribe({
      next: (data) => {
        this.report = data;
        this.buildChartData();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load report data';
        this.loading = false;
      }
    });
  }

  buildChartData(): void {
    if (!this.report) return;

    if (this.isAdmin) {
      // Merchant breakdown
      const totalM = (this.report.activeMerchants || 0) + (this.report.pendingMerchants || 0) + (this.report.suspendedMerchants || 0);
      if (totalM > 0) {
        this.merchantBreakdown = [
          { label: 'Active', value: this.report.activeMerchants || 0, color: '#22c55e', percent: Math.round(((this.report.activeMerchants || 0) / totalM) * 100) },
          { label: 'Pending', value: this.report.pendingMerchants || 0, color: '#f59e0b', percent: Math.round(((this.report.pendingMerchants || 0) / totalM) * 100) },
          { label: 'Suspended', value: this.report.suspendedMerchants || 0, color: '#ef4444', percent: Math.round(((this.report.suspendedMerchants || 0) / totalM) * 100) }
        ];
      }
    }

    // Transaction breakdown
    const totalT = (this.report.approvedTransactions || 0) + (this.report.pendingTransactions || 0) + (this.report.declinedTransactions || 0);
    if (totalT > 0) {
      this.transactionBreakdown = [
        { label: 'Approved', value: this.report.approvedTransactions || 0, color: '#22c55e', percent: Math.round(((this.report.approvedTransactions || 0) / totalT) * 100) },
        { label: 'Pending', value: this.report.pendingTransactions || 0, color: '#f59e0b', percent: Math.round(((this.report.pendingTransactions || 0) / totalT) * 100) },
        { label: 'Declined', value: this.report.declinedTransactions || 0, color: '#ef4444', percent: Math.round(((this.report.declinedTransactions || 0) / totalT) * 100) }
      ];
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  printReport(): void {
    window.print();
  }

  exportSummaryCsv(): void {
    this.reportService.exportSummaryReportCsv().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'summary-report.csv');
        this.toast.success('Summary report exported successfully');
      },
      error: () => this.toast.error('Failed to export summary report')
    });
  }

  exportTransactionsCsv(): void {
    this.reportService.exportTransactionsCsv().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'transactions-export.csv');
        this.toast.success('Transactions exported successfully');
      },
      error: () => this.toast.error('Failed to export transactions')
    });
  }

  exportSettlementsCsv(): void {
    this.reportService.exportSettlementsCsv().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'settlements-export.csv');
        this.toast.success('Settlements exported successfully');
      },
      error: () => this.toast.error('Failed to export settlements')
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
