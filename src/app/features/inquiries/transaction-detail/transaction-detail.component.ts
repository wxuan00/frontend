import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { RefundService } from '../../../core/services/refund.service';
import { ToastService } from '../../../core/services/toast.service';
import { MaskCardPipe } from '../../../shared/pipes/mask-card.pipe';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaskCardPipe],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.css']
})
export class TransactionDetailComponent implements OnInit {
  transaction: any = null;
  transactionId: number = 0;
  loading = true;
  showRefundDialog = false;
  requestingRefund = false;
  refundType: 'FULL' | 'PARTIAL' = 'FULL';
  partialAmount: number | null = null;
  partialAmountError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private refundService: RefundService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.transactionId = +this.route.snapshot.paramMap.get('id')!;
    this.transactionService.getTransactionById(this.transactionId).subscribe({
      next: (data) => {
        this.transaction = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  printDetail(): void {
    window.print();
  }

  openRefundDialog(): void {
    this.refundType = 'FULL';
    this.partialAmount = null;
    this.partialAmountError = '';
    this.showRefundDialog = true;
  }

  cancelRefundDialog(): void {
    this.showRefundDialog = false;
  }

  onRefundTypeChange(): void {
    this.partialAmount = null;
    this.partialAmountError = '';
  }

  confirmRequestRefund(): void {
    if (this.refundType === 'PARTIAL') {
      const max = parseFloat(this.transaction.amount);
      if (!this.partialAmount || this.partialAmount <= 0) {
        this.partialAmountError = 'Please enter a refund amount.';
        return;
      }
      if (this.partialAmount >= max) {
        this.partialAmountError = `Partial amount must be less than ${this.transaction.currency} ${max.toFixed(2)}.`;
        return;
      }
    }
    this.showRefundDialog = false;
    this.requestingRefund = true;
    const refundAmount = this.refundType === 'FULL'
      ? this.transaction.amount
      : this.partialAmount;
    const refundPayload = {
      transactionId: this.transaction.transactionId,
      merchantId: this.transaction.merchantId,
      cardNo: this.transaction.cardNo,
      currency: this.transaction.currency,
      amount: this.transaction.amount,
      refundAmount,
      refundType: this.refundType,
      transactionDate: this.transaction.txnDate
    };
    this.refundService.requestRefund(refundPayload).subscribe({
      next: (refund) => {
        this.requestingRefund = false;
        this.toastService.success('Refund request submitted successfully.');
        this.router.navigate(['/refunds', refund.refundId]);
      },
      error: () => {
        this.requestingRefund = false;
        this.toastService.error('Failed to submit refund request.');
      }
    });
  }
}
