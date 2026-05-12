import { Routes } from '@angular/router';
import { adminGuard, treasurerGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
  path: 'admin-reports',
  canActivate: [adminGuard],
  loadComponent: () => import('./pages/admin/admin-reports/admin-reports').then(m => m.AdminReports)
},
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.Login)
  },
  {
    path: 'admin-dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-dashboard/admin-dashboard')
        .then(m => m.AdminDashboard)
  },
  {
    path: 'admin-records',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-records/admin-records')
        .then(m => m.AdminRecords)
  },
  {
    path: 'admin-notifications',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-notifications/admin-notifications')
        .then(m => m.AdminNotifications)
  },
  {
    path: 'treasurer-dashboard',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-dashboard/treasurer-dashboard')
        .then(m => m.TreasurerDashboard)
  },
  {
    path: 'treasurer-home',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-home/treasurer-home')
        .then(m => m.Home)
  },
  {
    path: 'treasurer-records',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-records/treasurer-records')
        .then(m => m.Records)
  },
  {
    path: 'treasurer-settings',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-settings/treasurer-settings')
        .then(m => m.Settings)
  },
  {
    path: 'treasurer-about',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-about/treasurer-about')
        .then(m => m.About)
  },
  {
    path: 'treasurer-contact',
    canActivate: [treasurerGuard],
    loadComponent: () =>
      import('./pages/treasurer/treasurer-contact/treasurer-contact')
        .then(m => m.TreasurerContactComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
  
  
];