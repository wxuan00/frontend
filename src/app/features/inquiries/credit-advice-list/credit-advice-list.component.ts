import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditAdviceService } from '../../../core/services/credit-advice.service';
import { CreditAdvice } from '../../../core/models/index';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-credit-advice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './credit-advice-list.component.html',
  styleUrls: ['./credit-advice-list.component.css']
})
export class CreditAdviceListComponent implements OnInit {
  allCreditAdvices: CreditAdvice[] = [];
  filteredCreditAdvices: CreditAdvice[] = [];
  pagedCreditAdvices: CreditAdvice[] = [];
  searchTerm = '';
  filterStatus = '';
  dateFrom = '';
  dateTo = '';
  loading = true;
  loadError = false;

  currentPage = 1;
  pageSize = 10;
  sortField = 'paymentDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private router: Router,
    private creditAdviceService: CreditAdviceService
  ) {}

  ngOnInit(): void {
    this.loadCreditAdvices();
  }

  loadCreditAdvices() {
    this.loading = true;
    this.loadError = false;
    this.creditAdviceService.getAllCreditAdvices().subscribe({
      next: (data) => {
        this.allCreditAdvices = data as CreditAdvice[];
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.creditAdviceService.searchCreditAdvices(this.searchTerm).subscribe({
        next: (data) => {
          this.allCreditAdvices = data;
          this.applyFilters();
          this.loading = false;
        },
        error: () => { this.applyFilters(); this.loading = false; }
      });
    } else {
      this.loadCreditAdvices();
    }
  }

  applyFilters() {
    let filtered = [...this.allCreditAdvices];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(ca =>
        (ca.merchantName || '').toLowerCase().includes(term) ||
        (ca.creditAdviceId?.toString() || '').includes(term) ||
        (ca.accountNo || '').toLowerCase().includes(term)
      );
    }
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      filtered = filtered.filter(ca => ca.paymentDate && new Date(ca.paymentDate) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ca => ca.paymentDate && new Date(ca.paymentDate) <= to);
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[this.sortField];
      const bVal = (b as any)[this.sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredCreditAdvices = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedCreditAdvices = this.filteredCreditAdvices.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) { this.currentPage = page; this.updatePage(); }
  onPageSizeChange(size: number) { this.pageSize = size; this.currentPage = 1; this.updatePage(); }

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
    this.dateFrom = '';
    this.dateTo = '';
    this.loadCreditAdvices();
  }

  viewDetails(id: number) {
    this.router.navigate(['/credit-advices', id]);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
