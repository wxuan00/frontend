import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getToken()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredPermission: string = route.data?.['permission'];
  if (!requiredPermission) return true;

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  // No permission — redirect to dashboard (or login if dashboard is also denied)
  if (requiredPermission === 'VIEW_DASHBOARD') {
    router.navigate(['/login']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};
