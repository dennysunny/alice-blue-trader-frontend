import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">{{ icon }}</div>
      <div class="empty-state__title">{{ title }}</div>
      @if (subtitle) {
        <div class="empty-state__subtitle">{{ subtitle }}</div>
      }
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon = '📋';
  @Input() title = 'No data';
  @Input() subtitle = '';
}
