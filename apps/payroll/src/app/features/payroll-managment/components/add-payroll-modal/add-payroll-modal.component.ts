import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { PayrollFirebaseFacade } from '../../facade/payroll.facade';
import { PayrollFormData, Employee, PayrollRecord } from '../../api/payroll.firebase-api';

@Component({
  selector: 'app-add-payroll-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-payroll-modal.component.html',
  styleUrl: './add-payroll-modal.component.scss'
})
export class AddPayrollModalComponent implements OnInit, OnDestroy {
  @Input() editingRecord: PayrollRecord | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<PayrollRecord>();

  formData: PayrollFormData = {
    employeeName: '',
    employeeId: '',
    department: '',
    baseSalary: '',
    weeklyBonus: '0',
    monthlyBonus: '0',
    jobDoneBonus: '0',
    deductions: '0',
    netSalary: '0',
    status: 'Pending'
  };

  calculatedTax: string = '0.00';
  calculatedPension: string = '0.00';

  existingEmployeeIds: string[] = [];
  employeeIdError = '';
  employeeNameError = '';
  employees: Employee[] = [];
  payrollRecords: PayrollRecord[] = [];
  selectedEmployee: Employee | null = null;

  private destroy$ = new Subject<void>();

  constructor(private readonly payrollFacade: PayrollFirebaseFacade) {}

  ngOnInit(): void {
    this.loadExistingData();
    
    // If editingRecord is provided, populate the form
    if (this.editingRecord) {
      this.populateFormWithRecord();
    }
  }

  private populateFormWithRecord(): void {
    if (this.editingRecord) {
      this.formData = {
        employeeName: this.editingRecord.employeeName,
        employeeId: this.editingRecord.employeeId,
        department: this.editingRecord.department,
        baseSalary: this.editingRecord.baseSalary.toString(),
        weeklyBonus: this.editingRecord.weeklyBonus.toString(),
        monthlyBonus: this.editingRecord.monthlyBonus.toString(),
        jobDoneBonus: this.editingRecord.jobDoneBonus.toString(),
        deductions: this.editingRecord.deductions.toString(),
        netSalary: this.editingRecord.netSalary.toString(),
        status: this.editingRecord.status
      };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadExistingData(): void {
    console.log('AddPayrollModal: Loading existing data');
    
    // Load employees from Firebase
    this.payrollFacade.employees$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(employees => {
      console.log('AddPayrollModal: Employees loaded:', employees);
      this.employees = employees;
    });

    // Load existing payroll records for validation
    this.payrollFacade.payrollRecords$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(records => {
      console.log('AddPayrollModal: Payroll records loaded:', records);
      this.payrollRecords = records;
      this.existingEmployeeIds = records.map(record => record.employeeId);
    });
  }

  // 🔥 Employee selection from dropdown
  onEmployeeSelect(employeeId: string): void {
    if (!employeeId) {
      this.clearEmployeeData();
      return;
    }

    const employee = this.employees.find(emp => emp.empId === employeeId);
    if (employee) {
      this.selectedEmployee = employee;
      this.autoFillEmployeeData(employee);
      this.validateEmployeeId();
    }
  }

  private autoFillEmployeeData(employee: Employee): void {
    this.formData.employeeName = employee.fullName;
    this.formData.employeeId = employee.empId;
    this.formData.department = employee.position;
    this.formData.baseSalary = employee.baseSalary ? employee.baseSalary.toString() : '';
    
    // Trigger net salary calculation with the new base salary
    this.formData.netSalary = `$${this.calculateNetSalary()}`;
    
    // Clear any validation errors since we're using a valid employee
    this.employeeNameError = '';
    this.employeeIdError = '';
  }

  private clearEmployeeData(): void {
    this.selectedEmployee = null;
    this.formData.employeeName = '';
    this.formData.employeeId = '';
    this.formData.department = '';
    this.formData.baseSalary = '';
    this.formData.netSalary = '0';
    this.calculatedTax = '0.00';
    this.calculatedPension = '0.00';
    this.employeeNameError = '';
    this.employeeIdError = '';
  }

  validateEmployeeId(): void {
    const employeeId = this.formData.employeeId.trim();
    
    if (!employeeId) {
      this.employeeIdError = '';
      return;
    }

    // Check if employee ID already exists in payroll records
    if (this.existingEmployeeIds.includes(employeeId)) {
      this.employeeIdError = `Employee ID ${employeeId} already exists`;
      return;
    }

    // If we have a selected employee, no need for additional validation
    if (this.selectedEmployee && this.selectedEmployee.empId === employeeId) {
      this.employeeIdError = '';
      return;
    }

    // Check if employee ID exists in employee records
    this.payrollFacade.getEmployeeById(employeeId).subscribe(employee => {
      if (!employee) {
        this.employeeIdError = `Employee ID ${employeeId} is not a valid employee`;
      } else {
        this.employeeIdError = '';
        this.selectedEmployee = employee;
        this.autoFillEmployeeData(employee);
      }
    });
  }

  positions = [
    'Senior Sales Manager',
    'Marketing Lead',
    'Sales Representative',
    'HR Manager',
    'Finance Analyst',
    'Software Engineer',
    'Project Manager',
    'Business Analyst'
  ];

  calculateNetSalary(): string {
    const base = parseFloat(this.formData.baseSalary) || 0;
    const monthlyBonus = parseFloat(this.formData.monthlyBonus) || 0;
    
    // Use facade for calculation
    const calculation = this.payrollFacade.calculateNetSalary(base, monthlyBonus);
    this.calculatedTax = calculation.tax.toFixed(2);
    this.calculatedPension = calculation.pension.toFixed(2);
    this.formData.deductions = calculation.deductions.toFixed(2);
    
    return calculation.netSalary.toFixed(2);
  }

  onInputChange(): void {
    this.formData.netSalary = `$${this.calculateNetSalary()}`;
    
    // Only validate if we don't have a selected employee
    if (!this.selectedEmployee) {
      this.validateEmployeeId();
      this.validateEmployeeName();
    }
  }

  onEmployeeIdChange(): void {
    // If user manually changes the ID, clear the selected employee
    this.selectedEmployee = null;
    this.validateEmployeeId();
  }

  onEmployeeNameChange(): void {
    // If user manually changes the name, clear the selected employee
    this.selectedEmployee = null;
    this.validateEmployeeName();
  }

  validateEmployeeName(): void {
    const employeeName = this.formData.employeeName.trim();
    
    if (!employeeName) {
      this.employeeNameError = '';
      return;
    }

    // If we have a selected employee, no need for additional validation
    if (this.selectedEmployee && this.selectedEmployee.fullName === employeeName) {
      this.employeeNameError = '';
      return;
    }

    // Use facade validation
    const validation = this.payrollFacade.validateEmployeeName(employeeName, this.employees);
    
    if (!validation.isValid) {
      this.employeeNameError = validation.error || '';
    } else if (validation.employee) {
      this.selectedEmployee = validation.employee;
      this.autoFillEmployeeData(validation.employee);
    }
  }

  // Helper methods for template
  isEmployeeFound(): boolean {
    return !!(this.selectedEmployee);
  }

  findEmployeeById(): Employee | undefined {
    return this.selectedEmployee || this.employees.find(emp => emp.empId === this.formData.employeeId);
  }

  // Get available employees (exclude those already in payroll)
  getAvailableEmployees(): Employee[] {
    const usedEmployeeIds = this.existingEmployeeIds;
    return this.employees.filter(emp => !usedEmployeeIds.includes(emp.empId));
  }

  onClose(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (this.isFormValid()) {
      // Convert form data to payroll record
      const payrollRecord = {
        employeeName: this.formData.employeeName,
        employeeId: this.formData.employeeId,
        department: this.formData.department,
        baseSalary: parseFloat(this.formData.baseSalary) || 0,
        weeklyBonus: parseFloat(this.formData.weeklyBonus) || 0,
        monthlyBonus: parseFloat(this.formData.monthlyBonus) || 0,
        jobDoneBonus: parseFloat(this.formData.jobDoneBonus) || 0,
        deductions: parseFloat(this.formData.deductions) || 0,
        netSalary: parseFloat(this.formData.netSalary.replace('$', '')) || 0,
        status: this.formData.status as 'Pending' | 'Processed' | 'Paid'
      };

      this.save.emit(payrollRecord);
      this.resetForm();
      
      // Automatically close modal after successful save
      setTimeout(() => {
        this.onClose();
      }, 300); // Small delay to ensure the save operation completes
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.employeeName.trim() &&
      this.formData.employeeId.trim() &&
      this.formData.department.trim() &&
      this.formData.baseSalary &&
      !this.employeeIdError &&
      !this.employeeNameError
    );
  }

  private resetForm(): void {
    this.selectedEmployee = null;
    this.formData = {
      employeeName: '',
      employeeId: '',
      department: '',
      baseSalary: '',
      weeklyBonus: '0',
      monthlyBonus: '0',
      jobDoneBonus: '0',
      deductions: '0',
      netSalary: '0',
      status: 'Pending'
    };
    this.calculatedTax = '0.00';
    this.calculatedPension = '0.00';
    this.employeeIdError = '';
    this.employeeNameError = '';
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Method for parent component to show modal
  showModal(): void {
    // This will be handled by the parent component showing/hiding this component
  }
}
