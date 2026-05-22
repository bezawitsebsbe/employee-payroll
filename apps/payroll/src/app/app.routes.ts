import { Route } from '@angular/router';
import { SigninComponent } from '@employee-payroll/features';
import { AuthGuard, NoAuthGuard } from '@employee-payroll/features';

export const appRoutes: Route[] = [
  {
    path: '',
    component: SigninComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('@employee-payroll/features').then(m => m.AuthModule),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@employee-payroll/features').then(m => m.DashboardComponent),
    data: { currentApp: 'payroll' },
    canActivate: [AuthGuard]
  },
  {
    path: 'payroll',
    loadComponent: () => import('./features/payroll-managment/pages/payroll-management-page/payroll-management-page.component').then(m => m.PayrollManagementPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
