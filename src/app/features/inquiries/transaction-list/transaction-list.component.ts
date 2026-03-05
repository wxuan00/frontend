import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/index';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  allTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  pagedTransactions: Transaction[] = [];
  searchTerm = '';
  filterStatus = '';
  filterChannel = '';
  dateFrom = '';
  dateTo = '';
  loading = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Sorting
  sortField = 'txnDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private router: Router,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.transactionService.searchTransactions(this.searchTerm).subscribe({
        next: (data) => {
          this.allTransactions = data;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.applyFilters();
          this.loading = false;
        }
      });
    } else {
      this.loadTransactions();
    }
  }

  applyFilters() {
    let filtered = [...this.allTransactions];

    if (this.filterStatus) {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }
    if (this.filterChannel) {
      filtered = filtered.filter(t => t.paymentChannel === this.filterChannel);
    }
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      filtered = filtered.filter(t => t.txnDate && new Date(t.txnDate) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.txnDate && new Date(t.txnDate) <= to);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = (a as any)[this.sortField];
      const bVal = (b as any)[this.sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredTransactions = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedTransactions = this.filteredTransactions.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePage();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePage();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterChannel = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.loadTransactions();
  }

  viewDetails(id: number) {
    this.router.navigate(['/transactions', id]);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
