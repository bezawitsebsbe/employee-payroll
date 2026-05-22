import { Component, inject, OnInit, ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

import { EntityFormComponent, EntityColumn, EntityFormMode } from '@employee-payroll/entity';
import { EmployeeSimpleFacade } from '../../facades/employee-simple.facade';

@Component({
  selector: 'app-new-employee',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityFormComponent
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './new-employee.component.html',
  styleUrls: ['./new-employee.component.scss']
})
export class NewEmployeeComponent implements OnInit {
  private router = inject(Router);
  private facade = inject(EmployeeSimpleFacade);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  formMode: EntityFormMode = {
    mode: 'create',
    title: 'Add New Employee'
  };
  
  // Unique form instance key to prevent state conflicts (public for template access)
  public formInstanceKey = Math.random().toString(36).substring(2, 9);
  
  // Form fields configuration (same as employee detail)
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
      required: false
    },
    {
      key: 'baseSalary',
      name: 'Base Salary',
      label: 'Base Salary',
      type: 'number',
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
      key: 'joinDate',
      name: 'Join Date',
      label: 'Join Date',
      type: 'date',
      required: false
    }
  ];

  ngOnInit(): void {
    try {
      console.log('🔥 NewEmployeeComponent INITIALIZED - ROUTE ACTIVE');
      console.log('🔥 Current route:', this.router.url);
      console.log('🔥 Route should be /employee/add');
      
      // Initialize any required data
    } catch (error) {
      console.error('❌ Error in NewEmployeeComponent ngOnInit:', error);
    }
  }

  onFormSubmit(employeeData: Record<string, unknown>): void {
    console.log('🔥 NewEmployee form submitted with data:', employeeData);
    
    // Create employee
    this.facade.createEmployee(employeeData);
   
    
    // Refresh employee list to show new employee
    this.facade.loadEmployees();
    console.log('🔥 Triggered employee list refresh to show new employee');
  }

  onFormCancel(): void {
    console.log('🔥 NewEmployee form cancelled');
    this.message.info('Employee creation cancelled');
    // Just reset loading state, don't navigate away
    this.loading = false;
  }
}
