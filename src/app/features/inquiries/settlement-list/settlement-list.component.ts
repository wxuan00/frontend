import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettlementService } from '../../../core/services/settlement.service';
import { Settlement } from '../../../core/models/index';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './settlement-list.component.html',
  styleUrls: ['./settlement-list.component.css']
})
export class SettlementListComponent implements OnInit {
  allSettlements: Settlement[] = [];
  filteredSettlements: Settlement[] = [];
  pagedSettlements: Settlement[] = [];
  searchTerm = '';
  filterStatus = '';
  dateFrom = '';
  dateTo = '';
  loading = true;

  currentPage = 1;
  pageSize = 10;
  sortField = 'settlementDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private router: Router,
    private settlementService: SettlementService
  ) {}

  ngOnInit(): void {
    this.loadSettlements();
  }

  loadSettlements() {
    this.loading = true;
    this.settlementService.getAllSettlements().subscribe({
      next: (data) => {
        this.allSettlements = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.settlementService.searchSettlements(this.searchTerm).subscribe({
        next: (data) => {
          this.allSettlements = data;
          this.applyFilters();
          this.loading = false;
        },
        error: () => { this.applyFilters(); this.loading = false; }
      });
    } else {
      this.loadSettlements();
    }
  }

  applyFilters() {
    let filtered = [...this.allSettlements];
    if (this.filterStatus) {
      filtered = filtered.filter(s => s.settlementType === this.filterStatus);
    }
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      filtered = filtered.filter(s => s.settlementDate && new Date(s.settlementDate) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => s.settlementDate && new Date(s.settlementDate) <= to);
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[this.sortField];
      const bVal = (b as any)[this.sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredSettlements = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedSettlements = this.filteredSettlements.slice(start, start + this.pageSize);
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
    this.loadSettlements();
  }

  viewDetails(id: number) {
    this.router.navigate(['/settlements', id]);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
