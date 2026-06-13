import { Component, inject, signal } from '@angular/core';
import { SyncResult, TradeSyncService } from '../../../core/services/trade-sync.service';
import { NotificationService } from '../../../core/services/notification.service';

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

@Component({
  selector: 'app-sync-trade-button',
  standalone: true,
  template: `
    <div class="sync-wrap">
      <button
        class="sync-btn"
        [class.sync-btn--syncing]="state() === 'syncing'"
        [class.sync-btn--success]="state() === 'success'"
        [class.sync-btn--error]="state() === 'error'"
        [disabled]="state() === 'syncing'"
        (click)="sync()"
        [title]="
          lastResult()
            ? 'Last sync: ' + lastResult()!.tradesFound + ' trades'
            : 'Sync todays trades'
        "
      >
        <span class="sync-btn__icon">
          @if (state() === 'syncing') {
            <span class="spin">↻</span>
          } @else if (state() === 'success') {
            ✓
          } @else if (state() === 'error') {
            ✕
          } @else {
            ↻
          }
        </span>
        <span class="sync-btn__label">
          @if (state() === 'syncing') {
            Syncing…
          } @else if (state() === 'success') {
            Synced
          } @else if (state() === 'error') {
            Retry
          } @else {
            Sync Trades
          }
        </span>
      </button>

      @if (state() === 'success' && lastResult(); as r) {
        <div class="sync-result">
          {{ r.tradesFound }} trades · {{ r.wins }}W {{ r.losses }}L ·
          <span [class.up]="r.netPnl > 0" [class.down]="r.netPnl < 0">
            {{ r.netPnl >= 0 ? '+' : '' }}₹{{ r.netPnl | number: '1.0-0' }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sync-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sync-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 14px;
        border: 1px solid var(--color-border);
        border-radius: 7px;
        background: var(--color-surface-2);
        color: var(--color-text-secondary);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;

        &:hover:not(:disabled) {
          background: var(--color-surface-3);
          color: var(--color-text);
        }
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &--syncing {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        &--success {
          border-color: var(--color-up);
          color: var(--color-up);
          background: rgba(var(--color-up-rgb), 0.08);
        }
        &--error {
          border-color: var(--color-down);
          color: var(--color-down);
          background: rgba(var(--color-down-rgb), 0.08);
        }
      }

      .sync-btn__icon {
        font-size: 14px;
        line-height: 1;
      }
      .spin {
        display: inline-block;
        animation: spin 0.7s linear infinite;
      }

      .sync-result {
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      .up {
        color: var(--color-up);
        font-weight: 600;
      }
      .down {
        color: var(--color-down);
        font-weight: 600;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SyncButtonComponent {
  private readonly syncSvc = inject(TradeSyncService);
  private readonly notify = inject(NotificationService);

  state = signal<SyncState>('idle');
  lastResult = signal<SyncResult | null>(null);

  sync(): void {
    this.state.set('syncing');

    this.syncSvc.syncToday().subscribe({
      next: (result) => {
        this.lastResult.set(result);
        this.state.set('success');

        if (result.tradesFound === 0) {
          this.notify.info('No trades found for today yet.');
        } else {
          this.notify.success(
            `${result.tradesSynced} positions synced · ₹${result.netPnl >= 0 ? '+' : ''}${result.netPnl}`,
            'Sync Complete',
          );
        }

        // Reset to idle after 5s
        setTimeout(() => this.state.set('idle'), 5000);
      },
      error: (err) => {
        this.state.set('error');
        this.notify.error(err?.message ?? 'Sync failed. Check your connection.', 'Sync Failed');
        setTimeout(() => this.state.set('idle'), 4000);
      },
    });
  }
}
