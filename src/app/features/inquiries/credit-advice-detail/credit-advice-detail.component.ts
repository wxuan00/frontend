import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CreditAdviceService } from '../../../core/services/credit-advice.service';

@Component({
  selector: 'app-credit-advice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './credit-advice-detail.component.html',
  styleUrls: ['./credit-advice-detail.component.css']
})
export class CreditAdviceDetailComponent implements OnInit {
  creditAdvice: any = null;
  creditAdviceId: number = 0;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private creditAdviceService: CreditAdviceService
  ) {}

  ngOnInit(): void {
    this.creditAdviceId = +this.route.snapshot.paramMap.get('id')!;
    this.creditAdviceService.getCreditAdviceById(this.creditAdviceId).subscribe({
      next: (data) => {
        this.creditAdvice = data;
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
}
