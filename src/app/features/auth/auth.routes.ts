import { Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { CallbackComponent } from './components/callback/callback.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'callback', component: CallbackComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
