import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettlementService } from '../../../core/services/settlement.service';

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settlement-list.component.html',
  styleUrls: ['./settlement-list.component.css']
})
export class SettlementListComponent implements OnInit {
  settlements: any[] = [];
  allSettlements: any[] = [];
  searchTerm: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private settlementService: SettlementService
  ) {}

  ngOnInit(): void {
    this.loadSettlements();
  }

  loadSettlements() {
    this.settlementService.getAllSettlements().subscribe({
      next: (data) => {
        this.allSettlements = data;
        this.applyFilters();
      },
      error: (err) => console.error('Error loading settlements', err)
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.settlementService.searchSettlements(this.searchTerm).subscribe({
        next: (data) => {
          this.allSettlements = data;
          this.applyFilters();
        },
        error: () => this.applyFilters()
      });
    } else {
      this.loadSettlements();
    }
  }

  applyFilters() {
    let filtered = [...this.allSettlements];
    if (this.filterStatus) {
      filtered = filtered.filter(s => s.status === this.filterStatus);
    }
    this.settlements = filtered;
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
