import { Routes } from '@angular/router';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './pages/employee-detail/employee-detail.component';
import { NewEmployeeComponent } from './container/new-employee/new-employee.component';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
    children: [
      {
        path: 'detail/:id',
        component: EmployeeDetailComponent,
        title: 'Employee Details'
      },
      {
        path: 'add',
        component: NewEmployeeComponent,
        title: 'Add Employee'
      }
    ]
  }
];