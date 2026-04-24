import { Pipe, PipeTransform } from '@angular/core';

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

@Pipe({
  standalone: false, name: 'abbrevNum' })
export class AbbrevNumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    if (Math.abs(value) >= CRORE) return `${(value / CRORE).toFixed(2)}Cr`;
    if (Math.abs(value) >= LAKH) return `${(value / LAKH).toFixed(2)}L`;
    if (Math.abs(value) >= THOUSAND) return `${(value / THOUSAND).toFixed(2)}K`;
    return value.toString();
  }
}
