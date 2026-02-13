import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refund-list.component.html',
  styleUrls: ['./refund-list.component.css']
})
export class RefundListComponent implements OnInit {
  refunds: any[] = [];
  allRefunds: any[] = [];
  searchTerm: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds() {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => {
        // Filter for REFUND type transactions only
        this.allRefunds = data.filter((t: any) => t.type === 'REFUND');
        this.applyFilters();
      },
      error: (err) => console.error('Error loading refunds', err)
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.transactionService.searchTransactions(this.searchTerm).subscribe({
        next: (data) => {
          this.allRefunds = data.filter((t: any) => t.type === 'REFUND');
          this.applyFilters();
        },
        error: () => this.applyFilters()
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
    this.refunds = filtered;
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
