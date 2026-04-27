import { Routes } from '@angular/router';

import { StockDetailComponent } from './components/stock-detail/stock-detail.component';

export const stockDetailRoutes: Routes = [
  {
    path: ':exchange/:instrumentId',
    component: StockDetailComponent,
  },
];
