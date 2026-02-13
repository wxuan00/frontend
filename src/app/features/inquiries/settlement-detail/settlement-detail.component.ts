import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SettlementService } from '../../../core/services/settlement.service';

@Component({
  selector: 'app-settlement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settlement-detail.component.html',
  styleUrls: ['./settlement-detail.component.css']
})
export class SettlementDetailComponent implements OnInit {
  settlement: any = null;
  settlementId: number = 0;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private settlementService: SettlementService
  ) {}

  ngOnInit(): void {
    this.settlementId = +this.route.snapshot.paramMap.get('id')!;
    this.settlementService.getSettlementById(this.settlementId).subscribe({
      next: (data) => {
        this.settlement = data;
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
