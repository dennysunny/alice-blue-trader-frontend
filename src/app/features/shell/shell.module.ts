import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ShellLayoutComponent } from './components/layout/shell-layout.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'watchlist',
        loadChildren: () =>
          import('../watchlist/watchlist.module').then((m) => m.WatchlistModule),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('../orders/orders.module').then((m) => m.OrdersModule),
      },
      {
        path: 'portfolio',
        loadChildren: () =>
          import('../portfolio/portfolio.module').then((m) => m.PortfolioModule),
      },
      {
        path: 'positions',
        loadChildren: () =>
          import('../positions/positions.module').then((m) => m.PositionsModule),
      },
      {
        path: 'funds',
        loadChildren: () =>
          import('../funds/funds.module').then((m) => m.FundsModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  declarations: [ShellLayoutComponent, NavbarComponent, SidebarComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ShellModule {}
