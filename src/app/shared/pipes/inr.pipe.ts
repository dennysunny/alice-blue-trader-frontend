import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'inr',
})
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2, showSign = false): string {
    if (value == null) return '—';

    const abs = Math.abs(value);

    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(abs);

    if (!showSign) return formatted;

    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  }
}
