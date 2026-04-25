import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HoldingsProductType } from '../../../../core/enums/api.enums';
import { Holding } from '../../../../core/models/portfolio.models';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { InrPipe } from '../../../../shared/pipes/inr.pipe';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { holdingTypesConfig } from '../../configs/portfolio.config';
import { PriceTickerComponent } from '../../../../shared/components/price-ticker/price-ticker.component';

@Component({
  standalone: true,
  selector: 'app-portfolio-page',
  templateUrl: './portfolio-page.component.html',
  styleUrls: ['./portfolio-page.component.scss'],
  imports: [InrPipe, CommonModule, EmptyStateComponent, SpinnerComponent, PriceTickerComponent],
})
export class PortfolioPageComponent implements OnInit, OnDestroy {
  holdings: Holding[] = [];
  loading = true;
  selectedProductType: HoldingsProductType = HoldingsProductType.INTRADAY;

  get totalInvested(): number {
    return this.holdings.reduce((sum, h) => sum + h.averageTradedPrice * h.dpQuantity, 0);
  }

  get totalPnl(): number {
    return this.holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0);
  }

  get totalPnlPercent(): number {
    return this.totalInvested > 0 ? (this.totalPnl / this.totalInvested) * 100 : 0;
  }

  readonly holdingTypes = holdingTypesConfig;

  private readonly destroy$ = new Subject<void>();

  private readonly portfolioService = inject(PortfolioService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.getHoldingsData(this.selectedProductType);
  }

  getHoldingsData(productType: HoldingsProductType): void {
    this.selectedProductType = productType;
    this.portfolioService
      .getHoldings(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.holdings = res.result ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
