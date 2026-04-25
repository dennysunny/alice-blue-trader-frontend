import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { RouteSegment } from '../enums/app.enums';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_FORBIDDEN) {
        authService.logout();
        router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
      }

      return throwError(() => error);
    }),
  );
};
