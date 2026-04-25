import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FundGroups, FundsLimits } from '../../../../core/models/funds.models';
import { FundsService } from '../../../../core/services/funds.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { InrPipe } from '../../../../shared/pipes/inr.pipe';
import { fundRowsConfig } from '../../configs/funds.config';

@Component({
  standalone: true,
  selector: 'app-funds-page',
  templateUrl: './funds-page.component.html',
  styleUrls: ['./funds-page.component.scss'],
  imports: [EmptyStateComponent, InrPipe, SpinnerComponent],
})
export class FundsPageComponent implements OnInit, OnDestroy {
  loading = true;
  fundsGroups: FundGroups[] = [];

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
    this.fundsGroups = limits.map((limit) => ({
      segment: 'Funds',
      rows: fundRowsConfig.map((config) => ({
        label: config.label,
        key: config.key,
        value: limit[config.key],
        highlight: config.highlight ? config.highlight : false,
      })),
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
