import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RouteSegment } from '../enums/app.enums';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_FORBIDDEN) {
          this.authService.logout();
          this.router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
        }
        return throwError(() => error);
      })
    );
  }
}
