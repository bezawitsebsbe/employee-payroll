import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import {
  LoadEmployees,
  LoadEmployee,
  CreateEmployee,
  UpdateEmployee,
  DeleteEmployee
} from '../store/action/employee.action';
import { EmployeeState } from '../store/state/employee.state';

@Injectable({
  providedIn: 'root'
})
export class EmployeeSimpleFacade {
  employees$: Observable<any[]>;
  selectedEmployee$: Observable<any>;
  employeesLoading$: Observable<boolean>;
  employeeLoading$: Observable<boolean>;
  creatingEmployee$: Observable<boolean>;
  updatingEmployee$: Observable<boolean>;
  deletingEmployee$: Observable<boolean>;

  // Add selectedEmployee property
  get selectedEmployee(): any {
    let employee: any;
    this.selectedEmployee$.subscribe(emp => employee = emp).unsubscribe();
    return employee;
  }

  // Attendance-related properties for compatibility
  attendanceSearchTerm: string = '';
  attendanceDepartmentFilter: string | null = null;
  attendanceStatusFilter: string | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(private readonly store: Store) {
    this.employees$ = this.store.select(EmployeeState.employees);
    this.selectedEmployee$ = this.store.select(EmployeeState.selectedEmployee);
    this.employeesLoading$ = this.store.select(EmployeeState.employeesLoading);
    this.employeeLoading$ = this.store.select(EmployeeState.employeeLoading);
    this.creatingEmployee$ = this.store.select(EmployeeState.creatingEmployee);
    this.updatingEmployee$ = this.store.select(EmployeeState.updatingEmployee);
    this.deletingEmployee$ = this.store.select(EmployeeState.deletingEmployee);
  }

  loadEmployees(): void {
    this.store.dispatch(new LoadEmployees());
  }

  loadEmployee(id: string): void {
    this.store.dispatch(new LoadEmployee(id));
  }

  createEmployee(employee: any): void {
    this.store.dispatch(new CreateEmployee(employee));
  }

  updateEmployee(id: string, changes: any): void {
    this.store.dispatch(new UpdateEmployee({ id, changes }));
  }

  deleteEmployee(id: string): void {
    this.store.dispatch(new DeleteEmployee(id));
  }

  // Add missing methods for attendance component compatibility
  addEmployee(employee: any): void {
    this.createEmployee(employee);
  }

  // Attendance filter methods
  setAttendanceSearchTerm(term: string): void {
    this.attendanceSearchTerm = term;
  }

  setAttendanceDepartmentFilter(dept: string | null): void {
    this.attendanceDepartmentFilter = dept;
  }

  setAttendanceStatusFilter(status: string | null): void {
    this.attendanceStatusFilter = status;
  }

  // Add methods for accessing current values (for components that need synchronous access)
  get employees(): any[] {
    let employees: any[] = [];
    this.employees$.subscribe(emp => employees = emp).unsubscribe();
    return employees;
  }

  getSelectedEmployee(): any {
    let employee: any;
    this.selectedEmployee$.subscribe(emp => employee = emp).unsubscribe();
    return employee;
  }

  // Add filtered attendance property for compatibility
  get filteredAttendance(): any[] {
    // This should be implemented based on attendance data
    // For now, return empty array to prevent errors
    return [];
  }
}
