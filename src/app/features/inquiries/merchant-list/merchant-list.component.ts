import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // To navigate to details
import { MerchantService } from '../../../core/services/merchant.service'; // Check this path

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './merchant-list.component.html',
  styleUrls: ['./merchant-list.component.css']
})
export class MerchantListComponent implements OnInit {
  merchants: any[] = [];
  searchTerm: string = '';

  constructor(
    private merchantService: MerchantService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMerchants();
  }

  loadMerchants() {
    this.merchantService.getAllMerchants().subscribe(data => {
      this.merchants = data;
    });
  }

  search() {
    if (this.searchTerm.trim()) {
      this.merchantService.searchMerchants(this.searchTerm).subscribe(data => {
        this.merchants = data;
      });
    } else {
      this.loadMerchants();
    }
  }

  // Navigate to the Detail page
  viewDetails(id: number) {
    this.router.navigate(['/merchants', id]);
  }
}