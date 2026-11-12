import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

/** Admins can open every role's area; other roles only their own. */
function roleGuard(role: UserRole): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const current = authService.getRole();

    if (current === role || current === 'admin') {
      return true;
    }

    return router.createUrlTree([authService.homeRouteFor(current)]);
  };
}

export const donorGuard: CanActivateFn = roleGuard('donor');
export const receiverGuard: CanActivateFn = roleGuard('receiver');

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getRole() === 'admin') {
    return true;
  }

  return router.createUrlTree([authService.homeRouteFor(authService.getRole())]);
};
