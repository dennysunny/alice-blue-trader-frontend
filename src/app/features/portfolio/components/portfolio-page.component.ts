import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { Holding } from '../../../core/models/portfolio.models';
import { HoldingsProductType } from '../../../core/enums/api.enums';

@Component({
  standalone: false,
  selector: 'app-portfolio-page',
  templateUrl: './portfolio-page.component.html',
  styleUrls: ['./portfolio-page.component.scss'],
})
export class PortfolioPageComponent implements OnInit, OnDestroy {
  holdings: Holding[] = [];
  loading = true;

  get totalInvested(): number {
    return this.holdings.reduce((sum, h) => sum + h.averageTradedPrice * h.dpQuantity, 0);
  }

  get totalPnl(): number {
    return this.holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0);
  }

  get totalPnlPercent(): number {
    return this.totalInvested > 0 ? (this.totalPnl / this.totalInvested) * 100 : 0;
  }

  private readonly destroy$ = new Subject<void>();

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.getHoldings(HoldingsProductType.INTRADAY)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.holdings = res.result ?? []; this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
