import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FundsService } from '../../../core/services/funds.service';
import { FundsLimits } from '../../../core/models/funds.models';

interface FundsRow {
  label: string;
  value: number;
  highlight?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-funds-page',
  templateUrl: './funds-page.component.html',
  styleUrls: ['./funds-page.component.scss'],
})
export class FundsPageComponent implements OnInit, OnDestroy {
  loading = true;
  fundsGroups: Array<{ segment: string; rows: FundsRow[] }> = [];

  private readonly destroy$ = new Subject<void>();

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fundsService = inject(FundsService);

  ngOnInit(): void {
    this.getFundLimits();
  }

  getFundLimits(): void {
    this.fundsService
      .getFundsLimits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.buildFundsGroups(res.result ?? []);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private buildFundsGroups(limits: FundsLimits[]): void {
    this.fundsGroups = limits.map((l) => ({
      segment: 'Funds',
      rows: [
        {
          label: 'Available Margin',
          value: l.tradingLimit,
          highlight: true,
        },
        {
          label: 'Opening Balance',
          value: l.openingCashLimit,
        },
        {
          label: 'Utilized Margin',
          value: l.utilizedMargin,
        },
        {
          label: 'SPAN Margin',
          value: l.utilizedSpanMargin,
        },
        {
          label: 'Exposure Margin',
          value: l.utilizedExposureMargin,
        },
        {
          label: 'Collateral',
          value: l.collateralMargin,
        },
        {
          label: 'Adhoc Margin',
          value: l.adhocMargin,
        },
      ],
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
