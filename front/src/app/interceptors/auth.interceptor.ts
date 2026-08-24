import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isSessionExpiredShown = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (
        (error.status === 401 || error.status === 403) &&
        !isSessionExpiredShown
      ) {
        isSessionExpiredShown = true;
        authService.clearSession();
        setTimeout(() => {
          isSessionExpiredShown = false;
        }, 3000);
      }

      return throwError(() => error);
    })
  );
};
