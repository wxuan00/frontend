import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Check if the token exists
  if (authService.getToken()) {
    return true; // Pass allowed!
  } else {
    // 2. No token? Kick them out.
    router.navigate(['/login']);
    return false;
  }
};