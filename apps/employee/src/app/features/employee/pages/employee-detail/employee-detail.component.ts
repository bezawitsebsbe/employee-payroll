import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, takeUntil } from 'rxjs';
import { take } from 'rxjs/operators';
import { filter } from 'rxjs/operators';

import { EntityFormComponent, EntityColumn, EntityFormMode } from '@employee-payroll/entity';
import { Employee } from '../../models/employee.model';
import { EmployeeSimpleFacade } from '../../facades/employee-simple.facade';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzTagModule,
    NzDescriptionsModule,
    NzAvatarModule,
    NzSpinModule,
    EntityFormComponent
  ],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private facade = inject(EmployeeSimpleFacade);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChild(EntityFormComponent) entityFormRef!: EntityFormComponent;
  
  employee: Employee | null = null;
  loading = true;
  employeeId: string | null = null;
  saving = false;
  
  // Form mode - edit mode to enable save functionality
  formMode: EntityFormMode = {
    mode: 'edit',
    title: 'Employee Details'
  };
  
  
  get employeeRecord(): Record<string, unknown> {
    return this.employee as unknown as Record<string, unknown>;
  }
  
  // Form fields configuration
  fields: EntityColumn[] = [
    {
      key: 'fullName',
      name: 'Full Name',
      label: 'Full Name',
      type: 'text',
      required: true
    },
    {
      key: 'email',
      name: 'Email Address',
      label: 'Email Address',
      type: 'email',
      required: true
    },
    {
      key: 'phone',
      name: 'Phone Number',
      label: 'Phone Number',
      type: 'text',
      required: false
    },
    {
      key: 'department',
      name: 'Department',
      label: 'Department',
      type: 'select',
      required: true,
      options: ['Sales', 'Marketing', 'HR', 'Finance', 'IT']
    },
    {
      key: 'position',
      name: 'Position',
      label: 'Position',
      type: 'text',
      required: true
    },
    {
      key: 'joinDate',
      name: 'Join Date',
      label: 'Join Date',
      type: 'date',
      required: true
    },
    {
      key: 'status',
      name: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ['Active', 'Inactive', 'On Leave']
    },
    {
      key: 'baseSalary',
      name: 'Base Salary',
      label: 'Base Salary',
      type: 'number',
      required: false
    }
  ];
  
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    console.log(' DETAIL COMPONENT INIT');
    
    this.route.paramMap.subscribe(params => {
      const employeeId = params.get('id');
      console.log(' Detail params:', employeeId);
      if (employeeId) {
        console.log(' EmployeeId found, calling loadEmployee');
        this.loadEmployee(employeeId);
      } else {
        console.log(' No employeeId found in params');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // STEP 3 — LOAD DATA
  private loadEmployee(id: string): void {
    console.log(' loadEmployee called with id:', id);
    this.loading = true;
    this.employeeId = id; // Make sure employeeId is set
    console.log(' Set employeeId to:', this.employeeId);
    
    this.facade.loadEmployee(id);
    
    this.facade.selectedEmployee$
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe((employee) => {
        console.log(' Loaded employee:', employee);
        this.employee = employee;
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  private loadEmployeeFromList(id: string): void {
    // Get employee data from the list component's selection
    this.facade.employees$.pipe(take(1)).subscribe((employees: Employee[]) => {
     
      const employee = employees.find((emp: Employee) => emp.id === id);
      console.log(' Found employee:', employee);

      if (employee) {
        this.employee = employee;
        this.loading = false;
        this.cdr.detectChanges();
      } else {
        this.loading = false;
        console.log(' Employee not found in list');
      }
    });
  }

  onEdit(): void {
    if (this.employeeId) {
      this.router.navigate(['/employee/edit', this.employeeId]);
    }
  }

  onDelete($event: any): void {
    if (this.employee && this.employeeId) {
      // Show confirmation dialog using browser confirm
      if (confirm(`Are you sure you want to delete employee "${this.employee.fullName}"? This action cannot be undone.`)) {
        // Delete employee and wait for completion
        this.facade.deleteEmployee(this.employeeId);
        this.message.success('Employee deleted successfully');
        
        // Navigate back to parent route to reset to full table view
        // Add a longer delay to ensure delete operation completes and auth state is stable
        setTimeout(() => {
          this.facade.loadEmployees();
          this.router.navigate(['../'], { relativeTo: this.route });
        }, 2000);
      }
    }
  }

  onSave(formData: Record<string, unknown>): void {
    
    
    // Check if formData is a SubmitEvent (form submission issue)
    if (formData && typeof formData === 'object' && 'isTrusted' in formData) {
      console.log(' Received SubmitEvent instead of form data, blocking save');
      return;
    }
    
    if (!this.employeeId || this.saving) {
      console.log(' onSave blocked - no employeeId or already saving');
      return;
    }
    
    console.log(' Starting save process...');
    this.saving = true;
    
    // Debug the facade call
    console.log(' Calling facade.updateEmployee with:', this.employeeId, formData);
    
    // Update employee with form data
    this.facade.updateEmployee(this.employeeId, formData);
    
    console.log(' facade.updateEmployee called');
    // Remove duplicate success message - entity-form already shows one
    
    // Stop saving state after a delay
    setTimeout(() => {
      console.log(' Resetting saving state to false');
      this.saving = false;
    }, 1000);
  }

  onResetLoadingState(): void {
    this.saving = false;
  }

  onCancel(): void {
    console.log('🔥 EmployeeDetail onCancel called - cancel event received!');
    console.log('🔥 Cancel button clicked, resetting form to original state');
    
    if (this.employee) {
      console.log('🔥 Employee exists, calling populateForm');
      // Reset form to original employee data
      this.populateForm(this.employee);
      this.message.info('Changes discarded - form reset to original values');
    } else {
      console.log('❌ No employee data available to reset');
    }
  }

  onTestEvent(): void {
    console.log('🔥 Test event received - event binding works!');
  }

  private populateForm(employee: Employee): void {
    console.log('🔥 populateForm called with employee:', employee);
    
    // Update employee object to trigger entity-form update
    this.employee = { ...employee };
    
    // Reset loading state
    this.onResetLoadingState();
    
    // Force change detection to update the form
    this.cdr.detectChanges();
    
    console.log('🔥 Form reset triggered, employee updated:', this.employee);
  }

  onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Inactive':
        return 'red';
      case 'On Leave':
        return 'orange';
      default:
        return 'default';
    }
  }

  getDepartmentColor(department: string): string {
    switch (department) {
      case 'Sales':
        return 'blue';
      case 'Marketing':
        return 'green';
      case 'HR':
        return 'red';
      case 'Finance':
        return 'cyan';
      case 'IT':
        return 'purple';
      default:
        return 'default';
    }
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Helper method to format date
  formatDate(date: any): string {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  }
}
