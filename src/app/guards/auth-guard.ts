import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (user && user.role === 'admin') return true;
  router.navigate(['/login']);
  return false;
};

export const treasurerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (user && user.role === 'treasurer') return true;
  router.navigate(['/login']);
  return false;
};