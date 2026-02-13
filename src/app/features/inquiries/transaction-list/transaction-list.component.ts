import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  transactions: any[] = [];
  allTransactions: any[] = [];
  searchTerm: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.applyFilters();
      },
      error: (err) => console.error('Error loading transactions', err)
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.transactionService.searchTransactions(this.searchTerm).subscribe({
        next: (data) => {
          this.allTransactions = data;
          this.applyFilters();
        },
        error: () => this.applyFilters()
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
    this.transactions = filtered;
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
