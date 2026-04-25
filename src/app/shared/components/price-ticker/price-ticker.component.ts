import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

type TickDirection = 'up' | 'down' | 'neutral';

@Component({
  standalone: true,
  selector: 'app-price-ticker',
  template: `
    <span class="price-ticker price-ticker--{{ direction }}" [class.price-ticker--flash]="flash">
      {{ price | number: '1.2-2' }}
    </span>
  `,
  styleUrls: ['./price-ticker.component.scss'],
  imports: [CommonModule],
})
export class PriceTickerComponent implements OnChanges {
  @Input() price: number | null = null;
  @Input() prevPrice: number | null = null;

  direction: TickDirection = 'neutral';
  flash = false;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['price'] && this.prevPrice != null && this.price != null) {
      this.direction =
        this.price > this.prevPrice ? 'up' : this.price < this.prevPrice ? 'down' : 'neutral';
      this.triggerFlash();
    }
  }

  private triggerFlash(): void {
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flash = true;
    this.flashTimer = setTimeout(() => (this.flash = false), 600);
  }
}
