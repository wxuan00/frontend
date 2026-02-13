import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MerchantService } from '../../../core/services/merchant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './merchant-list.component.html',
  styleUrls: ['./merchant-list.component.css']
})
export class MerchantListComponent implements OnInit {
  allMerchants: any[] = [];
  merchants: any[] = [];
  searchTerm: string = '';
  filterStatus: string = '';
  isAdmin = false;

  constructor(
    private merchantService: MerchantService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadMerchants();
  }

  loadMerchants() {
    this.merchantService.getAllMerchants().subscribe(data => {
      this.allMerchants = data;
      this.applyFilters();
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.merchantService.searchMerchants(this.searchTerm).subscribe(data => {
        this.allMerchants = data;
        this.applyFilters();
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
    this.merchants = filtered;
  }

  viewDetails(id: number) {
    this.router.navigate(['/merchants', id]);
  }

  editMerchant(id: number) {
    this.router.navigate(['/merchants', id, 'edit']);
  }

  deleteMerchant(id: number, name: string) {
    if (confirm(`Are you sure you want to delete merchant "${name}"?`)) {
      this.merchantService.deleteMerchant(id).subscribe({
        next: () => this.loadMerchants(),
        error: (err) => alert('Error deleting merchant: ' + (err.error?.message || err.message))
      });
    }
  }
}