import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
  exportAs: 'appPullToRefresh',
})
export class PullToRefreshDirective {
  @Output() refresh = new EventEmitter<void>();

  private startY = 0;
  private pullDistance = 0;
  private isRefreshing = false;
  private threshold = 80;

  private contentEl!: HTMLElement;
  private indicatorEl!: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.setupDOM();
  }

  private setupDOM() {
    const host = this.el.nativeElement;

    // Wrap content
    this.contentEl = this.renderer.createElement('div');
    this.renderer.addClass(this.contentEl, 'ptr-content');

    while (host.firstChild) {
      this.renderer.appendChild(this.contentEl, host.firstChild);
    }

    // Indicator
    this.indicatorEl = this.renderer.createElement('div');
    this.renderer.addClass(this.indicatorEl, 'ptr-indicator');
    this.indicatorEl.innerText = '↓ Pull to refresh';

    this.renderer.appendChild(host, this.indicatorEl);
    this.renderer.appendChild(host, this.contentEl);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (window.scrollY === 0 && !this.isRefreshing) {
      this.startY = event.touches[0].clientY;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (window.scrollY > 0 || this.isRefreshing) return;

    const currentY = event.touches[0].clientY;
    const diff = currentY - this.startY;

    if (diff > 0) {
      this.pullDistance = Math.min(diff / 2, 120);
      this.updateUI();
    }
  }

  @HostListener('touchend')
  onTouchEnd() {
    if (this.pullDistance > this.threshold) {
      this.triggerRefresh();
    } else {
      this.reset();
    }
  }

  private updateUI() {
    this.renderer.setStyle(this.contentEl, 'transform', `translateY(${this.pullDistance}px)`);

    this.renderer.setStyle(this.indicatorEl, 'transform', `translateY(${this.pullDistance}px)`);

    this.indicatorEl.innerText =
      this.pullDistance > this.threshold ? '↑ Release to refresh' : '↓ Pull to refresh';
  }

  private triggerRefresh() {
    this.isRefreshing = true;
    this.pullDistance = 60;

    this.indicatorEl.innerText = '⟳ Refreshing...';
    this.updateUI();

    this.refresh.emit(); // 🔥 emit to parent
  }

  complete() {
    // call this from parent after API completes
    this.isRefreshing = false;
    this.reset();
  }

  private reset() {
    this.pullDistance = 0;

    this.renderer.setStyle(this.contentEl, 'transform', `translateY(0)`);
    this.renderer.setStyle(this.indicatorEl, 'transform', `translateY(0)`);

    this.indicatorEl.innerText = '↓ Pull to refresh';
  }
}
