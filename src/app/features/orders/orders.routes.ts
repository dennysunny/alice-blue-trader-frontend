import { Routes } from '@angular/router';
import { OrdersPageComponent } from './components/orders-page/orders-page.component';

export const ordersRoutes: Routes = [
  {
    path: '',
    component: OrdersPageComponent,
  },
];
