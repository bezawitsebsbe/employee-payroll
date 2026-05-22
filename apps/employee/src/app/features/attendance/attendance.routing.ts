import { Routes } from '@angular/router';
import { AttendanceComponent } from './pages/attendance/attendance.component';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    component: AttendanceComponent,
    title: 'Attendance Management'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
