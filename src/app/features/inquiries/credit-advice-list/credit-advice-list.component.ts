import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditAdviceService } from '../../../core/services/credit-advice.service';

@Component({
  selector: 'app-credit-advice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-advice-list.component.html',
  styleUrls: ['./credit-advice-list.component.css']
})
export class CreditAdviceListComponent implements OnInit {
  creditAdvices: any[] = [];
  allCreditAdvices: any[] = [];
  searchTerm: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private creditAdviceService: CreditAdviceService
  ) {}

  ngOnInit(): void {
    this.loadCreditAdvices();
  }

  loadCreditAdvices() {
    this.creditAdviceService.getAllCreditAdvices().subscribe({
      next: (data) => {
        this.allCreditAdvices = data;
        this.applyFilters();
      },
      error: (err) => console.error('Error loading credit advices', err)
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.creditAdviceService.searchCreditAdvices(this.searchTerm).subscribe({
        next: (data) => {
          this.allCreditAdvices = data;
          this.applyFilters();
        },
        error: () => this.applyFilters()
      });
    } else {
      this.loadCreditAdvices();
    }
  }

  applyFilters() {
    let filtered = [...this.allCreditAdvices];
    if (this.filterStatus) {
      filtered = filtered.filter(ca => ca.status === this.filterStatus);
    }
    this.creditAdvices = filtered;
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
