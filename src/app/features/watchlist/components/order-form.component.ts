import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { APP_CONSTANTS } from '../../../core/configs/api.config';
import {
  OrderComplexity,
  OrderType,
  ProductType,
  TransactionType,
  Validity,
} from '../../../core/enums/api.enums';
import { PlaceOrderRequest } from '../../../core/models/order.models';
import { WatchlistItem } from '../../../core/models/watchlist.models';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderService } from '../../../core/services/order.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  standalone: true,
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss'],
  imports: [ReactiveFormsModule, SpinnerComponent],
})
export class OrderFormComponent implements OnInit {
  @Input() item!: WatchlistItem;
  @Input() side: TransactionType = TransactionType.BUY;
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  submitting = false;

  readonly OrderType = OrderType;
  readonly ProductType = ProductType;
  readonly TransactionType = TransactionType;
  readonly Validity = Validity;

  readonly productOptions = [
    { label: 'Intraday (MIS)', value: ProductType.INTRADAY },
    { label: 'Delivery (CNC)', value: ProductType.DELIVERY },
    { label: 'Long Term', value: ProductType.LONGTERM },
  ];

  readonly orderTypeOptions = [
    { label: 'Market', value: OrderType.MARKET },
    { label: 'Limit', value: OrderType.LIMIT },
    { label: 'SL', value: OrderType.STOP_LOSS },
    { label: 'SL-M', value: OrderType.STOP_LOSS_MARKET },
  ];

  readonly validityOptions = [
    { label: 'Day', value: Validity.DAY },
    { label: 'IOC', value: Validity.IOC },
  ];

  private readonly orderService = inject(OrderService);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.trackOrderTypeChange();
  }

  get isBuy(): boolean {
    return this.form.get('transactionType')?.value === TransactionType.BUY;
  }
  get isMarket(): boolean {
    return this.form.get('orderType')?.value === OrderType.MARKET;
  }
  get showPrice(): boolean {
    const ot = this.form.get('orderType')?.value;
    return ot === OrderType.LIMIT || ot === OrderType.STOP_LOSS;
  }
  get showTrigger(): boolean {
    const ot = this.form.get('orderType')?.value;
    return ot === OrderType.STOP_LOSS || ot === OrderType.STOP_LOSS_MARKET;
  }

  buildForm(): void {
    this.form = this.fb.group({
      transactionType: [this.side],
      orderType: [OrderType.MARKET],
      product: [ProductType.INTRADAY],
      quantity: [APP_CONSTANTS.DEFAULT_QUANTITY, [Validators.required, Validators.min(1)]],
      price: [{ value: '', disabled: true }],
      triggerPrice: [{ value: '', disabled: true }],
      validity: [Validity.DAY],
    });
  }

  trackOrderTypeChange(): void {
    this.form.get('orderType')?.valueChanges.subscribe((ot: OrderType) => {
      const priceCtrl = this.form.get('price');
      const triggerCtrl = this.form.get('triggerPrice');
      if (ot === OrderType.LIMIT) {
        priceCtrl?.enable();
        priceCtrl?.setValidators(Validators.required);
        triggerCtrl?.disable();
        triggerCtrl?.clearValidators();
      } else if (ot === OrderType.STOP_LOSS) {
        priceCtrl?.enable();
        priceCtrl?.setValidators(Validators.required);
        triggerCtrl?.enable();
        triggerCtrl?.setValidators(Validators.required);
      } else if (ot === OrderType.STOP_LOSS_MARKET) {
        priceCtrl?.disable();
        priceCtrl?.clearValidators();
        triggerCtrl?.enable();
        triggerCtrl?.setValidators(Validators.required);
      } else {
        priceCtrl?.disable();
        priceCtrl?.clearValidators();
        triggerCtrl?.disable();
        triggerCtrl?.clearValidators();
      }
      priceCtrl?.updateValueAndValidity();
      triggerCtrl?.updateValueAndValidity();
    });
  }

  setSide(side: TransactionType): void {
    this.form.patchValue({ transactionType: side });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    const v = this.form.getRawValue() as {
      transactionType: TransactionType;
      orderType: OrderType;
      product: ProductType;
      quantity: number;
      price: string;
      triggerPrice: string;
      validity: Validity;
    };

    const payload: PlaceOrderRequest = {
      exchange: this.item.exchange,
      instrumentId: this.item.instrumentId,
      transactionType: v.transactionType,
      quantity: v.quantity,
      product: v.product,
      orderComplexity: OrderComplexity.REGULAR,
      orderType: v.orderType,
      validity: v.validity,
      price: v.price ?? '',
      slTriggerPrice: v.triggerPrice ?? '',
    };

    this.orderService.placeOrder([payload]).subscribe({
      next: () => {
        this.notifications.success(
          `${v.transactionType} order placed for ${this.item.formattedName}`,
          'Order Placed',
        );
        this.submitting = false;
        this.cdr.markForCheck();
        this.closed.emit();
      },
      error: (err) => {
        this.notifications.error(err?.error?.message ?? 'Order failed. Please try again.');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }
}
