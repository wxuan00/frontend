import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RefundService } from '../../../core/services/refund.service';
import { Refund } from '../../../core/models/index';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './refund-list.component.html',
  styleUrls: ['./refund-list.component.css']
})
export class RefundListComponent implements OnInit {
  allRefunds: Refund[] = [];
  filteredRefunds: Refund[] = [];
  pagedRefunds: Refund[] = [];
  searchTerm = '';
  filterStatus = '';
  dateFrom = '';
  dateTo = '';
  loading = true;

  currentPage = 1;
  pageSize = 10;
  sortField = 'submissionDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private router: Router,
    private refundService: RefundService
  ) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds() {
    this.loading = true;
    this.refundService.getAllRefunds().subscribe({
      next: (data) => {
        this.allRefunds = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.refundService.searchRefunds(this.searchTerm).subscribe({
        next: (data) => {
          this.allRefunds = data;
          this.applyFilters();
          this.loading = false;
        },
        error: () => { this.applyFilters(); this.loading = false; }
      });
    } else {
      this.loadRefunds();
    }
  }

  applyFilters() {
    let filtered = [...this.allRefunds];
    if (this.filterStatus) {
      filtered = filtered.filter(r => r.status === this.filterStatus);
    }
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      filtered = filtered.filter(r => r.submissionDate && new Date(r.submissionDate) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => r.submissionDate && new Date(r.submissionDate) <= to);
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[this.sortField];
      const bVal = (b as any)[this.sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredRefunds = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRefunds = this.filteredRefunds.slice(start, start + this.pageSize);
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
    this.loadRefunds();
  }

  viewDetails(id: number) {
    this.router.navigate(['/refunds', id]);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
