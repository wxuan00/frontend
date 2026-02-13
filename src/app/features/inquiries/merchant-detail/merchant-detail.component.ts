import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MerchantService } from '../../../core/services/merchant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-merchant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './merchant-detail.component.html',
  styleUrls: ['./merchant-detail.component.css']
})
export class MerchantDetailComponent implements OnInit {
  merchant: any = null;
  loading = true;
  merchantId: number = 0;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private merchantService: MerchantService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.merchantId = +this.route.snapshot.paramMap.get('id')!;
    this.merchantService.getMerchantById(this.merchantId).subscribe({
      next: (data) => {
        this.merchant = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
