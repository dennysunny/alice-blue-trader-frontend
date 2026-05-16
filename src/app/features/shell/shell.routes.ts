import { Routes } from '@angular/router';

import { ShellLayoutComponent } from './components/layout/shell-layout.component';
import { authGuard } from '../../core/guards/auth.guard';
import { RouteSegment } from '../../core/enums/app.enums';

export const shellRoutes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: RouteSegment.DASHBOARD,
        loadChildren: () => import('../dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: RouteSegment.WATCHLIST,
        loadChildren: () => import('../watchlist/watchlist.routes').then((m) => m.watchlistRoutes),
      },
      {
        path: RouteSegment.ORDERS,
        loadChildren: () => import('../orders/orders.routes').then((m) => m.ordersRoutes),
      },
      {
        path: RouteSegment.PORTFOLIO,
        loadChildren: () => import('../portfolio/portfolio.routes').then((m) => m.portfolioRoutes),
      },
      {
        path: RouteSegment.POSITIONS,
        loadChildren: () => import('../positions/positions.routes').then((m) => m.positionsRoutes),
      },
      {
        path: RouteSegment.FUNDS,
        loadChildren: () => import('../funds/funds.routes').then((m) => m.fundsRoutes),
      },
      {
        path: RouteSegment.STOCK_DETAIL,
        loadChildren: () =>
          import('../stock-detail/stock-detail.routes').then((m) => m.stockDetailRoutes),
      },
      {
        path: RouteSegment.OPTION_CHAIN,
        loadComponent: () =>
          import('../stock-detail/components/option-chain/option-chain.component').then(
            (m) => m.OptionChainComponent,
          ),
      },
      {
        path: RouteSegment.REPORTS,
        loadComponent: () =>
          import('../reports/components/reports-page/reports-page').then((m) => m.ReportsPage),
      },
    ],
  },
];
