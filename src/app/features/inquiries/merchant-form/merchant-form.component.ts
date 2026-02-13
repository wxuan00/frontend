import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MerchantService } from '../../../core/services/merchant.service';

@Component({
  selector: 'app-merchant-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './merchant-form.component.html',
  styleUrls: ['./merchant-form.component.css']
})
export class MerchantFormComponent implements OnInit {
  isEditMode = false;
  merchantId: number | null = null;
  message = '';
  errorMessage = '';

  formData: any = {
    businessName: '',
    businessRegistrationNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    status: 'ACTIVE'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private merchantService: MerchantService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.merchantId = +idParam;
      this.merchantService.getMerchantById(this.merchantId).subscribe({
        next: (merchant) => {
          if (merchant) {
            this.formData = {
              businessName: merchant.businessName || '',
              businessRegistrationNumber: merchant.businessRegistrationNumber || '',
              email: merchant.email || '',
              phoneNumber: merchant.phoneNumber || '',
              address: merchant.address || '',
              status: merchant.status || 'ACTIVE'
            };
          }
        },
        error: () => this.errorMessage = 'Error loading merchant details'
      });
    }
  }

  onSubmit() {
    this.message = '';
    this.errorMessage = '';

    if (this.isEditMode && this.merchantId) {
      this.merchantService.updateMerchant(this.merchantId, this.formData).subscribe({
        next: () => {
          this.message = 'Merchant updated successfully';
          setTimeout(() => this.router.navigate(['/merchants', this.merchantId]), 1000);
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error updating merchant'
      });
    } else {
      this.merchantService.createMerchant(this.formData).subscribe({
        next: () => {
          this.message = 'Merchant created successfully';
          setTimeout(() => this.router.navigate(['/merchants']), 1000);
        },
        error: (err) => this.errorMessage = err.error?.message || 'Error creating merchant'
      });
    }
  }

  cancel() {
    if (this.isEditMode && this.merchantId) {
      this.router.navigate(['/merchants', this.merchantId]);
    } else {
      this.router.navigate(['/merchants']);
    }
  }
}
