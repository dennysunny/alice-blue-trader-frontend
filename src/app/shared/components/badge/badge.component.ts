import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../../enums/ui.enums';

@Component({
  standalone: false,
  selector: 'app-badge',
  template: `<span class="badge badge--{{variant}}"><ng-content></ng-content></span>`,
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = BadgeVariant.NEUTRAL;
}
