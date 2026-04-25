import { Component, Input, Output, EventEmitter } from '@angular/core';

import { ButtonVariant, ButtonSize } from '../../enums/ui.enums';

@Component({
  standalone: false,
  selector: 'app-button',
  template: `
    <button
      class="btn btn--{{ variant }} btn--{{ size }}"
      [class.btn--loading]="loading"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
    >
      @if (loading) {
        <app-spinner size="sm"></app-spinner>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = ButtonVariant.PRIMARY;
  @Input() size: ButtonSize = ButtonSize.MD;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() clicked = new EventEmitter<MouseEvent>();
}
