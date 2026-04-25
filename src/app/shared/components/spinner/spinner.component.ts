import { Component, Input } from '@angular/core';
import { SpinnerSize } from '../../enums/ui.enums';

@Component({
  standalone: true,
  selector: 'app-spinner',
  template: `<div class="spinner spinner--{{ size }}"></div>`,
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = SpinnerSize.MD;
}
