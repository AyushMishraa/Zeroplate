import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: (allowedRoles: string[]) => CanActivateFn = (allowedRoles) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      router.navigate(['/login']);
      return false;
    }
    
    if (!allowedRoles.includes(currentUser.role)) {
      router.navigate(['/home']);
      return false;
    }
    
    return true;
  };
};

