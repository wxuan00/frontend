import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // 1. SKIP LOGIN: If the URL is for login/register, let it pass untouched
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // 2. Read token directly from LocalStorage (Avoids circular dependency loops)
  const token = localStorage.getItem('token');

  // 3. If token exists, attach it
  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error) => {
      // 4. Auto-logout on 401 Unauthorized (expired/invalid token)
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};