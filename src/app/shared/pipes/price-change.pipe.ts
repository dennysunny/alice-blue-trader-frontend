import { Pipe, PipeTransform } from '@angular/core';
import { APP_CONSTANTS } from '../../core/configs/api.config';

@Pipe({
  standalone: false, name: 'priceChange' })
export class PriceChangePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    const decimals = APP_CONSTANTS.PRICE_DECIMAL_PLACES;
    const formatted = Math.abs(value).toFixed(decimals);
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
}
