import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteSegment } from './core/enums/app.enums';

const routes: Routes = [
  {
    path: RouteSegment.AUTH,
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/shell/shell.module').then((m) => m.ShellModule),
  },
  { path: '**', redirectTo: RouteSegment.DASHBOARD },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
