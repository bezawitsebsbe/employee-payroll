import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { Observable, Subject, takeUntil } from 'rxjs';
import { PayrollStatisticsCardsComponent } from '../../components/payroll-statistics-cards/payroll-statistics-cards.component';
import { PayrollTableComponent } from '../../components/payroll-table/payroll-table.component';
import { AddPayrollModalComponent } from '../../components/add-payroll-modal/add-payroll-modal.component';

import { SidebarComponent } from '@employee-payroll/sidebar';
import { PayrollFirebaseFacade } from '../../facade/payroll.facade';
import { PayrollRecord } from '../../api/payroll.firebase-api';

@Component({
  selector: 'app-payroll-management-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzTypographyModule,
    PayrollStatisticsCardsComponent,
    PayrollTableComponent,
    AddPayrollModalComponent,
   
   SidebarComponent
  ],
  templateUrl: './payroll-management-page.component.html',
  styleUrls: ['./payroll-management-page.component.scss']
})
export class PayrollManagementPageComponent implements OnInit, OnDestroy {
  @ViewChild(AddPayrollModalComponent) addPayrollModal!: AddPayrollModalComponent;
  
  searchTerm: string = '';
  selectedDepartment: string = 'all';
  
  // Navigation items for sidebar
  navItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Payroll', icon: '💰', path: '/payroll' }
  ];
  isModalVisible: boolean = false;
  editingRecord: PayrollRecord | null = null;

  // Firebase data observables
  public payrollRecords$!: Observable<PayrollRecord[]>;
  public loading$!: Observable<boolean>;
  public error$!: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(private readonly payrollFacade: PayrollFirebaseFacade) {}

  ngOnInit(): void {
    this.initializeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData(): void {
    // Initialize Firebase data streams
    this.payrollRecords$ = this.payrollFacade.filteredPayrollRecords$;
    this.loading$ = this.payrollFacade.loading$;
    this.error$ = this.payrollFacade.error$;

    // Handle errors
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        console.error('Payroll management error:', error);
      }
    });
  }

  onExport(): void {
    this.payrollFacade.exportPayrollData().subscribe(csvData => {
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  onAddPayroll(): void {
    this.editingRecord = null;
    this.isModalVisible = true;
  }

  onModalCancel(): void {
    this.isModalVisible = false;
    this.editingRecord = null;
  }

  onEditRecord(record: PayrollRecord): void {
    console.log('Edit record:', record);
    this.editingRecord = record;
    this.isModalVisible = true;
  }

  onModalSave(payrollData: any): void {
    console.log('PayrollManagementPage: Saving payroll data:', payrollData);
    
    if (this.editingRecord && this.editingRecord.id) {
      // Update existing record
      this.payrollFacade.updatePayrollRecord(this.editingRecord.id, payrollData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          console.log('PayrollManagementPage: Payroll record updated successfully');
          this.isModalVisible = false;
          this.editingRecord = null;
        },
        error: (error) => {
          console.error('PayrollManagementPage: Error updating payroll record:', error);
        }
      });
    } else {
      // Create new record
      this.payrollFacade.createPayrollRecord(payrollData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (id) => {
          console.log('PayrollManagementPage: Payroll record created successfully with ID:', id);
          this.isModalVisible = false;
        },
        error: (error) => {
          console.error('PayrollManagementPage: Error creating payroll record:', error);
        }
      });
    }
  }

  onDeleteRecord(record: PayrollRecord): void {
    console.log('Delete record:', record);
    if (record.id && confirm(`Are you sure you want to delete payroll record for ${record.employeeName}?`)) {
      this.payrollFacade.deletePayrollRecord(record.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          console.log('Payroll record deleted successfully');
          // Data will be automatically refreshed through the observable stream
        },
        error: (error) => {
          console.error('Error deleting payroll record:', error);
          // You could show a notification here
        }
      });
    }
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.payrollFacade.setSearchTerm(searchTerm);
  }

  onDepartmentChange(department: string): void {
    this.selectedDepartment = department;
    this.payrollFacade.setSelectedDepartment(department);
  }

  // Clear any errors
  clearError(): void {
    this.payrollFacade.clearError();
  }

  // Refresh data
  refreshData(): void {
    this.payrollFacade.refreshPayrollRecords();
    this.payrollFacade.refreshEmployees();
  }
}
