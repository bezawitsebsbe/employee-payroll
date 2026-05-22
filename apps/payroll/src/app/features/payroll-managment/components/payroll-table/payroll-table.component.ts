import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Observable, Subject, takeUntil, of } from 'rxjs';
import { PayrollRecord } from '../../api/payroll.firebase-api';
import { PayrollFirebaseFacade } from '../../facade/payroll.facade';

@Component({
  selector: 'app-payroll-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule,
    NzPopconfirmModule,
    NzSpinModule
  ],
  templateUrl: './payroll-table.component.html'
})
export class PayrollTableComponent implements OnInit, OnDestroy {
  @Input() searchTerm: string = '';
  @Input() selectedDepartment: string = 'all';
  @Output() editRecord = new EventEmitter<PayrollRecord>();

  payrollRecords$: Observable<PayrollRecord[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(private payrollFacade: PayrollFirebaseFacade) {
    // Initialize with Firebase facade observables
    this.payrollRecords$ = this.payrollFacade.filteredPayrollRecords$;
    this.loading$ = this.payrollFacade.loading$;
    this.error$ = this.payrollFacade.error$;
  }

  ngOnInit(): void {
    // Initialize data loading through facade
    this.payrollFacade.refreshPayrollRecords();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEdit(record: PayrollRecord): void {
    // TODO: Implement edit functionality
    // You could open an edit modal with the record data
    // For now, just emit the record
    this.editRecord.emit(record);
  }

  refreshData(): void {
    // Refresh data through facade
    this.payrollFacade.refreshPayrollRecords();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Paid':
        return 'green';
      case 'Pending':
        return 'orange';
      case 'Processed':
        return 'blue';
      default:
        return 'default';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
