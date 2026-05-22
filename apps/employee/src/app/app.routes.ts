import { Routes } from '@angular/router';
import { authRoutes } from '@employee-payroll/core';
import { DashboardComponent } from '@employee-payroll/features';
import { NavbarComponent } from '@employee-payroll/navbar';
import { navResolver } from '@employee-payroll/navbar';
import { AuthGuard} from '@employee-payroll/core';



export const appRoutes: Routes = [
  ...authRoutes, 
  {
  path: '',
  component: NavbarComponent,
  resolve: { navItems: navResolver },
  data: { app: 'employee' },
  canActivate: [AuthGuard],          // protects the parent itself
  canActivateChild: [AuthGuard],     // protects ALL children automatically
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent
    },
    {
  path: 'employee',
  loadChildren: () =>
    import('./features/employee/employee.routing')
      .then(m => m.EMPLOYEE_ROUTES)
},
   {
  path: 'attendance',
  loadChildren: () =>
    import('./features/attendance/attendance.routing')
      .then(m => m.ATTENDANCE_ROUTES)
}, {
      path: 'attendance',
      loadComponent: () =>
        import(
          './features/attendance/pages/attendance/attendance.component'
        ).then((m) => m.AttendanceComponent),
    },
  ],
},
  {
    path: '**',
    redirectTo: '/signin',
  },
];
