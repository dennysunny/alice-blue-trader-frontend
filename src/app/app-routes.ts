import { Routes } from '@angular/router';

import { RouteSegment } from './core/enums/app.enums';

export const routes: Routes = [
  {
    path: RouteSegment.AUTH,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./features/shell/shell.routes').then((m) => m.shellRoutes),
  },
  { path: '**', redirectTo: RouteSegment.DASHBOARD },
];
