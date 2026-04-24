import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Pipes
import { PriceChangePipe } from './pipes/price-change.pipe';
import { InrPipe } from './pipes/inr.pipe';
import { AbbrevNumPipe } from './pipes/abbrev-num.pipe';

// Components
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BadgeComponent } from './components/badge/badge.component';
import { ButtonComponent } from './components/button/button.component';
import { ModalComponent } from './components/modal/modal.component';
import { ToastContainerComponent } from './components/toast/toast-container.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { PriceTickerComponent } from './components/price-ticker/price-ticker.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

const PIPES = [PriceChangePipe, InrPipe, AbbrevNumPipe];
const COMPONENTS = [
  SpinnerComponent,
  BadgeComponent,
  ButtonComponent,
  ModalComponent,
  ToastContainerComponent,
  EmptyStateComponent,
  PriceTickerComponent,
  SearchBarComponent,
];

@NgModule({
  declarations: [...PIPES, ...COMPONENTS],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  exports: [...PIPES, ...COMPONENTS, CommonModule, ReactiveFormsModule, FormsModule],
})
export class SharedModule {}
