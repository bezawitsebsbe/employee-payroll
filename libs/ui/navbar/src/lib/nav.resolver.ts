import { ResolveFn } from '@angular/router';

export interface NavItem {
  label: string;
  path: string;
  apps?: string[]; // Which apps should show this item
}

export const navResolver: ResolveFn<NavItem[]> = (route) => {
  const app = route.data['app'];

  if (app === 'employee') {
    return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Employee', path: '/employee' },
      { label: 'Attendance', path: '/attendance' },
    ];
  }

  if (app === 'payroll') {
    return [
      { label: 'Dashboard',  path: '/dashboard' },
      { label: 'Payroll', path: '/payroll' },
      { label: 'Reports',  path: '/payroll/reports' },
    ];
  }

  return [];
};
 