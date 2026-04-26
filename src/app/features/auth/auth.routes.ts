import { Routes } from '@angular/router';

import { RouteSegment } from '../../core/enums/app.enums';
import { CallbackComponent } from './components/callback/callback.component';
import { LoginComponent } from './components/login/login.component';

export const authRoutes: Routes = [
  { path: RouteSegment.LOGIN, component: LoginComponent },
  { path: RouteSegment.CALLBACK, component: CallbackComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
