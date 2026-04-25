import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pnlState',
  standalone: true,
})
export class PnlStatePipe implements PipeTransform {
  transform(value: number): boolean | null {
    if (value > 0) return true;
    if (value < 0) return false;
    return null;
  }
}
