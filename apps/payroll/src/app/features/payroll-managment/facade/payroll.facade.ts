import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { PayrollFirebaseStore, PayrollState } from '../store/payroll.firebase-store';
import { PayrollFirebaseApi, Employee, PayrollRecord } from '../api/payroll.firebase-api';
import { DashboardFacadeService } from '@employee-payroll/features';

@Injectable({
  providedIn: 'root'
})
export class PayrollFirebaseFacade {
  // Observable properties from store
  public employees$: Observable<Employee[]>;
  public payrollRecords$: Observable<PayrollRecord[]>;
  public loading$: Observable<boolean>;
  public error$: Observable<string | null>;
  public searchTerm$: Observable<string>;
  public selectedDepartment$: Observable<string>;
  public selectedStatus$: Observable<string>;
  public statistics$: Observable<any>;
  public filteredEmployees$: Observable<Employee[]>;
  public filteredPayrollRecords$: Observable<PayrollRecord[]>;

  constructor(
    private store: PayrollFirebaseStore,
    private api: PayrollFirebaseApi,
    private dashboardFacade: DashboardFacadeService
  ) {
    // Initialize observable properties from store
    this.employees$ = this.store.employees$;
    this.payrollRecords$ = this.store.payrollRecords$;
    this.loading$ = this.store.loading$;
    this.error$ = this.store.error$;
    this.searchTerm$ = this.store.searchTerm$;
    this.selectedDepartment$ = this.store.selectedDepartment$;
    this.selectedStatus$ = this.store.selectedStatus$;
    this.statistics$ = this.store.statistics$;
    this.filteredEmployees$ = this.store.filteredEmployees$;
    this.filteredPayrollRecords$ = this.store.filteredPayrollRecords$;
  }

  // 🔥 Data access methods
  public getEmployees(): Observable<Employee[]> {
    return this.employees$;
  }

  public getPayrollRecords(): Observable<PayrollRecord[]> {
    return this.payrollRecords$;
  }

  public getFilteredPayrollRecords(): Observable<PayrollRecord[]> {
    return this.filteredPayrollRecords$;
  }

  public getFilteredEmployees(): Observable<Employee[]> {
    return this.filteredEmployees$;
  }

  public getStatistics(): Observable<any> {
    return this.statistics$;
  }

  public getLoading(): Observable<boolean> {
    return this.loading$;
  }

  public getError(): Observable<string | null> {
    return this.error$;
  }

  public getSearchTerm(): Observable<string> {
    return this.searchTerm$;
  }

  public getSelectedDepartment(): Observable<string> {
    return this.selectedDepartment$;
  }

  public getSelectedStatus(): Observable<string> {
    return this.selectedStatus$;
  }

  // 🔥 Employee operations
  public getEmployeeById(empId: string): Observable<Employee | null> {
    return this.store.getEmployeeById(empId);
  }

  public searchEmployees(searchTerm: string): Observable<Employee[]> {
    return this.api.searchEmployees(searchTerm);
  }

  public refreshEmployees(): void {
    this.store.refreshEmployees();
  }

  // 🔥 Payroll record operations
  public createPayrollRecord(record: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    // Track the payroll activity in dashboard
    console.log('Creating payroll record and tracking activity:', record);
    this.dashboardFacade.trackPayrollActivity(
      `Payroll record created for ${record.employeeName} - $${record.netSalary}`,
      record.netSalary
    );
    
    return this.store.createPayrollRecord(record);
  }

  public updatePayrollRecord(id: string, record: Partial<PayrollRecord>): Observable<void> {
    // Track the payroll update activity in dashboard
    this.dashboardFacade.trackPayrollActivity(
      `Payroll record updated for ${record.employeeName}`,
      record.netSalary || 0
    );
    
    return this.store.updatePayrollRecord(id, record);
  }

  public deletePayrollRecord(id: string): Observable<void> {
    // Get the payroll record details before deletion for activity tracking
    return this.store.getPayrollRecordById(id).pipe(
      map((record: PayrollRecord | null) => {
        if (record) {
          // Track the payroll deletion activity in dashboard
          this.dashboardFacade.trackPayrollDeletion(
            `Payroll record deleted for ${record.employeeName} - $${record.netSalary}`,
            record.netSalary
          );
        }
        return record;
      }),
      switchMap((record: PayrollRecord | null) => this.store.deletePayrollRecord(id))
    );
  }

  public getPayrollRecordById(id: string): Observable<PayrollRecord | null> {
    return this.store.getPayrollRecordById(id);
  }

  public getPayrollRecordsByStatus(status: string): Observable<PayrollRecord[]> {
    return this.api.getPayrollRecordsByStatus(status);
  }

  public refreshPayrollRecords(): void {
    this.store.refreshPayrollRecords();
  }

  // 🔥 Filter operations
  public setSearchTerm(searchTerm: string): void {
    this.store.setSearchTerm(searchTerm);
  }

  public setSelectedDepartment(department: string): void {
    this.store.setSelectedDepartment(department);
  }

  public setSelectedStatus(status: string): void {
    this.store.setSelectedStatus(status);
  }

  // 🔥 Statistics
  public refreshStatistics(): void {
    this.store.refreshStatistics();
  }

  // 🔥 Utility methods
  public clearError(): void {
    this.store.clearError();
  }

  public resetState(): void {
    this.store.resetState();
  }

  public getCurrentState(): PayrollState {
    return this.store.getCurrentState();
  }

  // 🔥 Validation helpers
  public validateEmployeeId(employeeId: string, existingRecords: PayrollRecord[]): { isValid: boolean; error?: string } {
    if (!employeeId.trim()) {
      return { isValid: false, error: 'Employee ID is required' };
    }

    // Check if employee ID already exists in payroll records
    const existingIds = existingRecords.map(record => record.employeeId);
    if (existingIds.includes(employeeId)) {
      return { isValid: false, error: `Employee ID ${employeeId} already exists` };
    }

    return { isValid: true };
  }

  public validateEmployeeName(employeeName: string, employees: Employee[]): { isValid: boolean; error?: string; employee?: Employee } {
    if (!employeeName.trim()) {
      return { isValid: false, error: 'Employee name is required' };
    }

    const employee = employees.find(emp => 
      emp.fullName.toLowerCase() === employeeName.toLowerCase()
    );

    if (!employee) {
      return { isValid: false, error: `'${employeeName}' is not a registered employee` };
    }

    return { isValid: true, employee };
  }

  public calculateNetSalary(baseSalary: number, monthlyBonus: number, weeklyBonus: number = 0, jobDoneBonus: number = 0): {
    netSalary: number;
    tax: number;
    pension: number;
    deductions: number;
  } {
    // Calculate tax based on base salary only (Ethiopian tax brackets)
    const tax = this.calculateTaxBracket(baseSalary);
    
    // Calculate pension (7% of basic salary)
    const pension = baseSalary * 0.07;
    
    // Total deductions = tax + pension
    const deductions = tax + pension;
    
    // Total income = base + all bonuses
    const totalIncome = baseSalary + monthlyBonus + weeklyBonus + jobDoneBonus;
    
    // Net salary = total income - deductions
    const netSalary = Math.max(0, totalIncome - deductions);

    return {
      netSalary,
      tax,
      pension,
      deductions
    };
  }

  private calculateTaxBracket(income: number): number {
    // Ethiopian Birr (ETB) tax brackets
    if (income <= 600) {
      return income * 0.00; // 0% for income up to 600 ETB
    } else if (income <= 1650) {
      return income * 0.10; // 10% for income between 601 - 1,650 ETB
    } else if (income <= 3200) {
      return income * 0.15; // 15% for income between 1,651 - 3,200 ETB
    } else if (income <= 5250) {
      return income * 0.20; // 20% for income between 3,201 - 5,250 ETB
    } else if (income <= 7800) {
      return income * 0.25; // 25% for income between 5,251 - 7,800 ETB
    } else if (income <= 10900) {
      return income * 0.30; // 30% for income between 7,801 - 10,900 ETB
    } else {
      return income * 0.35; // 35% for income above 10,900 ETB
    }
  }

  // 🔥 Dashboard data aggregation
  public getDashboardData(): Observable<{
    totalEmployees: number;
    activePayrollRecords: number;
    totalPayrollAmount: number;
    pendingRecords: number;
    recentRecords: PayrollRecord[];
    topDepartments: Array<{ department: string; count: number; totalSalary: number }>;
  }> {
    return combineLatest([
      this.employees$,
      this.payrollRecords$
    ]).pipe(
      map(([employees, records]) => {
        const totalEmployees = employees.length;
        const activePayrollRecords = records.length;
        const totalPayrollAmount = records.reduce((sum, record) => sum + record.netSalary, 0);
        const pendingRecords = records.filter(r => r.status === 'Pending').length;
        
        // Get recent records (last 5)
        const recentRecords = records
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 5);

        // Group by department
        const departmentMap = new Map<string, { count: number; totalSalary: number }>();
        records.forEach(record => {
          const dept = record.department;
          if (!departmentMap.has(dept)) {
            departmentMap.set(dept, { count: 0, totalSalary: 0 });
          }
          const deptData = departmentMap.get(dept)!;
          deptData.count++;
          deptData.totalSalary += record.netSalary;
        });

        const topDepartments = Array.from(departmentMap.entries())
          .map(([department, data]) => ({ department, ...data }))
          .sort((a, b) => b.totalSalary - a.totalSalary)
          .slice(0, 5);

        return {
          totalEmployees,
          activePayrollRecords,
          totalPayrollAmount,
          pendingRecords,
          recentRecords,
          topDepartments
        };
      })
    );
  }

  // 🔥 Export functionality
  public exportPayrollData(): Observable<string> {
    return this.getPayrollRecords().pipe(
      map(records => {
        // Convert to CSV format
        const headers = [
          'Employee Name',
          'Employee ID',
          'Department',
          'Base Salary',
          'Weekly Bonus',
          'Monthly Bonus',
          'Job Done Bonus',
          'Deductions',
          'Net Salary',
          'Status',
          'Created At'
        ];

        const csvContent = [
          headers.join(','),
          ...records.map(record => [
            record.employeeName,
            record.employeeId,
            record.department,
            record.baseSalary,
            record.weeklyBonus,
            record.monthlyBonus,
            record.jobDoneBonus,
            record.deductions,
            record.netSalary,
            record.status,
            record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''
          ].join(','))
        ].join('\n');

        return csvContent;
      })
    );
  }
}
