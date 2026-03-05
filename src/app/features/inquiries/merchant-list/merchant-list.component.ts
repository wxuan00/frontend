import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MerchantService } from '../../../core/services/merchant.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { Merchant } from '../../../core/models/index';

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './merchant-list.component.html',
  styleUrls: ['./merchant-list.component.css']
})
export class MerchantListComponent implements OnInit {
  allMerchants: Merchant[] = [];
  filteredMerchants: Merchant[] = [];
  merchants: Merchant[] = [];
  loading = true;
  searchTerm: string = '';
  filterStatus: string = '';
  isAdmin = false;

  // Pagination
  pagination = { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 };

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Confirm dialog state
  showDeleteDialog = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';

  constructor(
    private merchantService: MerchantService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadMerchants();
  }

  loadMerchants() {
    this.loading = true;
    this.merchantService.getAllMerchants().subscribe({
      next: (data) => {
        this.allMerchants = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.merchantService.searchMerchants(this.searchTerm).subscribe({
        next: (data) => {
          this.allMerchants = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      this.loadMerchants();
    }
  }

  applyFilters() {
    let filtered = [...this.allMerchants];
    if (this.filterStatus) {
      filtered = filtered.filter(m => m.status === this.filterStatus);
    }

    // Sorting
    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        const valA = (a[this.sortColumn] || '').toString().toLowerCase();
        const valB = (b[this.sortColumn] || '').toString().toLowerCase();
        const cmp = valA.localeCompare(valB);
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    this.filteredMerchants = filtered;
    this.pagination.totalItems = filtered.length;
    this.pagination.totalPages = Math.max(1, Math.ceil(filtered.length / this.pagination.pageSize));
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = 1;
    }
    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    this.merchants = filtered.slice(start, start + this.pagination.pageSize);
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.applyFilters();
  }

  onPageSizeChange(size: number) {
    this.pagination.pageSize = size;
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  viewDetails(id: number) {
    this.router.navigate(['/merchants', id]);
  }

  editMerchant(id: number) {
    this.router.navigate(['/merchants', id, 'edit']);
  }

  deleteMerchant(id: number, name: string) {
    this.deleteTargetId = id;
    this.deleteTargetName = name;
    this.showDeleteDialog = true;
  }

  confirmDeleteMerchant() {
    if (this.deleteTargetId !== null) {
      this.merchantService.deleteMerchant(this.deleteTargetId).subscribe({
        next: () => {
          this.toast.success('Merchant deleted successfully');
          this.loadMerchants();
        },
        error: (err) => this.toast.error('Error deleting merchant: ' + (err.error?.message || err.message))
      });
    }
    this.showDeleteDialog = false;
  }

  cancelDeleteMerchant() {
    this.showDeleteDialog = false;
    this.deleteTargetId = null;
  }
}