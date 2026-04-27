import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Exchange,
  TransactionType,
  OrderType,
  ProductType,
  OrderComplexity,
  Validity,
} from '../../../../core/enums/api.enums';
import { APP_CONSTANTS } from '../../../../core/configs/api.config';

interface SelectOpt {
  label: string;
  value: string;
}

const PRODUCT_OPTS: SelectOpt[] = [
  { label: 'Intraday (MIS)', value: ProductType.INTRADAY },
  { label: 'Delivery (CNC)', value: ProductType.DELIVERY },
  { label: 'Long Term', value: ProductType.LONGTERM },
];

const ORDER_TYPE_OPTS: SelectOpt[] = [
  { label: 'Market', value: OrderType.MARKET },
  { label: 'Limit', value: OrderType.LIMIT },
  { label: 'SL', value: OrderType.STOP_LOSS },
  { label: 'SL-M', value: OrderType.STOP_LOSS_MARKET },
];

const VALIDITY_OPTS: SelectOpt[] = [
  { label: 'Day', value: Validity.DAY },
  { label: 'IOC', value: Validity.IOC },
];

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent implements OnInit {
  @Input({ required: true }) instrumentId!: string;
  @Input({ required: true }) exchange!: Exchange;
  @Input({ required: true }) name!: string;
  @Input({ required: true }) ltp!: number;
  @Input({ required: true }) side!: TransactionType;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderService);
  private readonly notify = inject(NotificationService);

  readonly productOpts = PRODUCT_OPTS;
  readonly orderTypeOpts = ORDER_TYPE_OPTS;
  readonly validityOpts = VALIDITY_OPTS;
  readonly TransactionType = TransactionType;
  readonly OrderType = OrderType;

  form!: FormGroup;
  submitting = signal(false);

  get isBuy() {
    return this.form.get('transactionType')?.value === TransactionType.BUY;
  }
  get orderType() {
    return this.form.get('orderType')?.value as OrderType;
  }
  get showPrice() {
    return this.orderType === OrderType.LIMIT || this.orderType === OrderType.STOP_LOSS;
  }
  get showTrigger() {
    return this.orderType === OrderType.STOP_LOSS || this.orderType === OrderType.STOP_LOSS_MARKET;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      transactionType: [this.side],
      orderType: [OrderType.MARKET],
      product: [ProductType.INTRADAY],
      quantity: [APP_CONSTANTS.DEFAULT_QUANTITY, [Validators.required, Validators.min(1)]],
      price: [{ value: '', disabled: true }],
      triggerPrice: [{ value: '', disabled: true }],
      validity: [Validity.DAY],
    });

    this.form.get('orderType')!.valueChanges.subscribe((ot: OrderType) => {
      const price = this.form.get('price')!;
      const trigger = this.form.get('triggerPrice')!;
      price.disable();
      price.clearValidators();
      trigger.disable();
      trigger.clearValidators();

      if (ot === OrderType.LIMIT) {
        price.enable();
        price.setValidators(Validators.required);
      } else if (ot === OrderType.STOP_LOSS) {
        price.enable();
        price.setValidators(Validators.required);
        trigger.enable();
        trigger.setValidators(Validators.required);
      } else if (ot === OrderType.STOP_LOSS_MARKET) {
        trigger.enable();
        trigger.setValidators(Validators.required);
      }
      price.updateValueAndValidity();
      trigger.updateValueAndValidity();
    });
  }

  setSide(s: TransactionType): void {
    this.form.patchValue({ transactionType: s });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);

    const v = this.form.getRawValue() as {
      transactionType: TransactionType;
      orderType: OrderType;
      product: ProductType;
      quantity: number;
      price: string;
      triggerPrice: string;
      validity: Validity;
    };

    this.orders
      .placeOrder([
        {
          exchange: this.exchange,
          instrumentId: this.instrumentId,
          transactionType: v.transactionType,
          quantity: v.quantity,
          product: v.product,
          orderComplexity: OrderComplexity.REGULAR,
          orderType: v.orderType,
          validity: v.validity,
          price: v.price ?? '',
          slTriggerPrice: v.triggerPrice ?? '',
        },
      ])
      .subscribe({
        next: () => {
          this.notify.success(`${v.transactionType} order placed for ${this.name}`, 'Order Placed');
          this.submitting.set(false);
          this.closed.emit();
        },
        error: (err) => {
          this.notify.error(err?.error?.message ?? 'Order failed. Please try again.');
          this.submitting.set(false);
        },
      });
  }
}
