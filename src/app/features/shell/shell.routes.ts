import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './components/layout/shell-layout.component';
import { authGuard } from '../../core/guards/auth.guard';

export const shellRoutes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: 'watchlist',
        loadChildren: () => import('../watchlist/watchlist.routes').then((m) => m.watchlistRoutes),
      },
      {
        path: 'orders',
        loadChildren: () => import('../orders/orders.routes').then((m) => m.ordersRoutes),
      },
      {
        path: 'portfolio',
        loadChildren: () => import('../portfolio/portfolio.routes').then((m) => m.portfolioRoutes),
      },
      {
        path: 'positions',
        loadChildren: () => import('../positions/positions.routes').then((m) => m.positionsRoutes),
      },
      {
        path: 'funds',
        loadChildren: () => import('../funds/funds.routes').then((m) => m.fundsRoutes),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
