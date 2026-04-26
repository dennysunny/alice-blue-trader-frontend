import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { RouteSegment } from '../enums/app.enums';
import { ERRORS } from '../configs/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === ERRORS.HTTP_UNAUTHORIZED || error.status === ERRORS.HTTP_FORBIDDEN) {
        authService.logout();
        router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
      }

      return throwError(() => error);
    }),
  );
};
