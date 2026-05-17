import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { TradingRulesRow } from '../../../../core/models/reports.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportsService } from '../../../../core/services/reports.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-trading-rules',
  standalone: true,
  imports: [ReactiveFormsModule, SpinnerComponent, DecimalPipe],
  templateUrl: './trading-rules.html',
  styleUrl: './trading-rules.scss',
})
export class TradingRulesComponent implements OnInit {
  private readonly svc = inject(ReportsService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  loading = signal(true);
  saving = signal(false);
  currentRules = signal<TradingRulesRow | null>(null);

  ngOnInit(): void {
    this.svc.getRules().subscribe({
      next: (rules) => {
        this.currentRules.set(rules);
        this.buildForm(rules);
        this.loading.set(false);
      },
      error: () => {
        this.buildForm(null);
        this.loading.set(false);
      },
    });
  }

  private buildForm(rules: TradingRulesRow | null): void {
    this.form = this.fb.group({
      max_trades_per_day: [
        rules?.max_trades_per_day ?? 5,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      max_loss_per_day: [rules?.max_loss_per_day ?? 2000, [Validators.required, Validators.min(0)]],
      max_loss_per_trade: [
        rules?.max_loss_per_trade ?? 500,
        [Validators.required, Validators.min(0)],
      ],
      max_quantity_per_trade: [
        rules?.max_quantity_per_trade ?? 50,
        [Validators.required, Validators.min(1)],
      ],
      target_per_day: [rules?.target_per_day ?? null],
      notes: [rules?.notes ?? ''],
      enforce_stoploss: [rules?.enforce_stoploss ?? false],
      allow_revenge_trading: [rules?.allow_revenge_trading ?? false],
      max_consecutive_losses: [rules?.max_consecutive_losses ?? 3],
      cooldown_minutes: [rules?.cooldown_minutes ?? 60],
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    this.svc.saveRules(this.form.value as Partial<TradingRulesRow>).subscribe({
      next: (rules) => {
        this.currentRules.set(rules);
        this.saving.set(false);
        this.notify.success('Trading rules saved', 'Rules Updated');
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to save rules');
      },
    });
  }
}
