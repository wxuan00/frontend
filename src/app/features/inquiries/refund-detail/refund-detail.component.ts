import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-refund-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './refund-detail.component.html',
  styleUrls: ['./refund-detail.component.css']
})
export class RefundDetailComponent implements OnInit {
  refund: any = null;
  refundId: number = 0;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.refundId = +this.route.snapshot.paramMap.get('id')!;
    this.transactionService.getTransactionById(this.refundId).subscribe({
      next: (data) => {
        this.refund = data;
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
}
