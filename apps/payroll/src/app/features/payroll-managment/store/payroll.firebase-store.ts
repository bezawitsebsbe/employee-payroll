import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, tap, catchError, switchMap, startWith } from 'rxjs/operators';
import { PayrollFirebaseApi, Employee, PayrollRecord } from '../api/payroll.firebase-api';

export interface PayrollState {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedDepartment: string;
  selectedStatus: string;
  statistics: {
    totalPayroll: number;
    totalEmployees: number;
    totalBonuses: number;
    totalDeductions: number;
    pendingCount: number;
    processedCount: number;
    paidCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PayrollFirebaseStore {
  private initialState: PayrollState = {
    employees: [],
    payrollRecords: [],
    loading: false,
    error: null,
    searchTerm: '',
    selectedDepartment: 'all',
    selectedStatus: 'all',
    statistics: {
      totalPayroll: 0,
      totalEmployees: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      pendingCount: 0,
      processedCount: 0,
      paidCount: 0
    }
  };

  private state$ = new BehaviorSubject<PayrollState>(this.initialState);

  // Public observables
  public employees$ = this.state$.asObservable().pipe(map(state => state.employees));
  public payrollRecords$ = this.state$.asObservable().pipe(map(state => state.payrollRecords));
  public loading$ = this.state$.asObservable().pipe(map(state => state.loading));
  public error$ = this.state$.asObservable().pipe(map(state => state.error));
  public searchTerm$ = this.state$.asObservable().pipe(map(state => state.searchTerm));
  public selectedDepartment$ = this.state$.asObservable().pipe(map(state => state.selectedDepartment));
  public selectedStatus$ = this.state$.asObservable().pipe(map(state => state.selectedStatus));
  public statistics$ = this.state$.asObservable().pipe(map(state => state.statistics));

  // Computed observables
  public filteredEmployees$ = combineLatest([
    this.employees$,
    this.searchTerm$
  ]).pipe(
    map(([employees, searchTerm]) => {
      if (!searchTerm.trim()) return employees;
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      return employees.filter(emp => 
        emp.fullName.toLowerCase().includes(lowerSearchTerm) ||
        emp.empId.toLowerCase().includes(lowerSearchTerm) ||
        emp.position.toLowerCase().includes(lowerSearchTerm)
      );
    })
  );

  public filteredPayrollRecords$ = combineLatest([
    this.payrollRecords$,
    this.searchTerm$,
    this.selectedDepartment$,
    this.selectedStatus$
  ]).pipe(
    map(([records, searchTerm, department, status]) => {
      let filtered = records;

      // Filter by search term
      if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(record => 
          record.employeeName.toLowerCase().includes(lowerSearchTerm) ||
          record.employeeId.toLowerCase().includes(lowerSearchTerm) ||
          record.department.toLowerCase().includes(lowerSearchTerm)
        );
      }

      // Filter by department
      if (department !== 'all') {
        filtered = filtered.filter(record => 
          record.department.toLowerCase() === department.toLowerCase()
        );
      }

      // Filter by status
      if (status !== 'all') {
        filtered = filtered.filter(record => record.status === status);
      }

      return filtered;
    })
  );

  constructor(private api: PayrollFirebaseApi) {
    console.log('PayrollFirebaseStore: Initializing store');
    this.loadInitialData();
  }

  // 🔥 Load initial data
  private loadInitialData(): void {
    console.log('PayrollFirebaseStore: Loading initial data');
    this.updateState({ ...this.initialState, loading: true });

    // Load employees and payroll records in parallel
    combineLatest([
      this.api.getEmployees(),
      this.api.getPayrollRecords(),
      this.api.getPayrollStatistics()
    ]).pipe(
      tap(([employees, records, statistics]) => {
        console.log('PayrollFirebaseStore: Data loaded successfully', { employees, records, statistics });
        this.updateState({
          employees,
          payrollRecords: records,
          statistics,
          loading: false,
          error: null
        });
      }),
      catchError(error => {
        console.error('PayrollFirebaseStore: Error loading initial data:', error);
        this.updateState({
          ...this.initialState,
          loading: false,
          error: 'Failed to load data'
        });
        return of([]);
      })
    ).subscribe();
  }

  // 🔥 Update state
  private updateState(newState: Partial<PayrollState>): void {
    const currentState = this.state$.value;
    this.state$.next({ ...currentState, ...newState });
  }

  // 🔥 Actions
  public setSearchTerm(searchTerm: string): void {
    this.updateState({ searchTerm });
  }

  public setSelectedDepartment(department: string): void {
    this.updateState({ selectedDepartment: department });
  }

  public setSelectedStatus(status: string): void {
    this.updateState({ selectedStatus: status });
  }

  public createPayrollRecord(record: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    console.log('PayrollStore: Creating payroll record', record);
    this.updateState({ loading: true, error: null });

    return this.api.createPayrollRecord(record).pipe(
      tap(id => {
        console.log('PayrollStore: Payroll record created with ID:', id);
        // Refresh payroll records after creation
        this.refreshPayrollRecords();
      }),
      catchError(error => {
        console.error('Error creating payroll record:', error);
        this.updateState({ loading: false, error: 'Failed to create payroll record' });
        throw error;
      })
    );
  }

  public updatePayrollRecord(id: string, record: Partial<PayrollRecord>): Observable<void> {
    this.updateState({ loading: true, error: null });

    return this.api.updatePayrollRecord(id, record).pipe(
      tap(() => {
        // Refresh payroll records after update
        this.refreshPayrollRecords();
      }),
      catchError(error => {
        console.error('Error updating payroll record:', error);
        this.updateState({ loading: false, error: 'Failed to update payroll record' });
        throw error;
      })
    );
  }

  public deletePayrollRecord(id: string): Observable<void> {
    this.updateState({ loading: true, error: null });

    return this.api.deletePayrollRecord(id).pipe(
      tap(() => {
        // Refresh payroll records after deletion
        this.refreshPayrollRecords();
      }),
      catchError(error => {
        console.error('Error deleting payroll record:', error);
        this.updateState({ loading: false, error: 'Failed to delete payroll record' });
        throw error;
      })
    );
  }

  public refreshEmployees(): void {
    this.api.getEmployees().pipe(
      tap(employees => {
        this.updateState({ employees });
      }),
      catchError(error => {
        console.error('Error refreshing employees:', error);
        this.updateState({ error: 'Failed to refresh employees' });
        return of([]);
      })
    ).subscribe();
  }

  public refreshPayrollRecords(): void {
    console.log('PayrollStore: Refreshing payroll records');
    this.api.getPayrollRecords().pipe(
      tap(records => {
        console.log('PayrollStore: Refreshed records', records);
        this.updateState({ payrollRecords: records, loading: false });
        // Also refresh statistics
        this.refreshStatistics();
      }),
      catchError(error => {
        console.error('Error refreshing payroll records:', error);
        this.updateState({ loading: false, error: 'Failed to refresh payroll records' });
        return of([]);
      })
    ).subscribe();
  }

  public refreshStatistics(): void {
    this.api.getPayrollStatistics().pipe(
      tap(statistics => {
        this.updateState({ statistics });
      }),
      catchError(error => {
        console.error('Error refreshing statistics:', error);
        this.updateState({ error: 'Failed to refresh statistics' });
        return of(this.initialState.statistics);
      })
    ).subscribe();
  }

  public clearError(): void {
    this.updateState({ error: null });
  }

  // 🔥 Get current state (for debugging)
  public getCurrentState(): PayrollState {
    return this.state$.value;
  }

  // 🔥 Get employee by ID
  public getEmployeeById(empId: string): Observable<Employee | null> {
    return this.api.getEmployeeById(empId);
  }

  // 🔥 Get payroll record by ID
  public getPayrollRecordById(id: string): Observable<PayrollRecord | null> {
    return this.api.getPayrollRecordById(id);
  }

  // 🔥 Reset state
  public resetState(): void {
    this.state$.next(this.initialState);
    this.loadInitialData();
  }
}
