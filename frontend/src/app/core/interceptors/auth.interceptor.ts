import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * - Adds the Bearer token (email/password logins) to API calls.
 * - Sends cookies with API calls so Google OAuth sessions (httpOnly cookie) work.
 * - On a 401 from a protected endpoint, ends the session and sends the user to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  if (!isApiCall) {
    return next(req);
  }

  const token = authService.getToken();
  const authReq = req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {})
  });

  const isAuthEndpoint = req.url.startsWith(`${environment.apiUrl}/auth/`);

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint && authService.isAuthenticated()) {
        authService.clearSession();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url, expired: 1 }
        });
      }
      return throwError(() => error);
    })
  );
};
