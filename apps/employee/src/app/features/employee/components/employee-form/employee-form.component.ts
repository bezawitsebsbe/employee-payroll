import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

import { EntityFormComponent, EntityColumn, EntityFormMode } from '@employee-payroll/entity';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityFormComponent
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() loading = false;
  
  @Output() submit = new EventEmitter<Employee>();
  @Output() cancel = new EventEmitter<void>();

  formMode: EntityFormMode = {
    mode: this.mode,
    title: this.mode === 'create' ? 'Add New Employee' : 'Edit Employee'
  };

  formFields: EntityColumn[] = [
    {
      key: 'fullName',
      name: 'Full Name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name'
    },
    {
      key: 'email',
      name: 'Email Address',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'employee@company.com'
    },
    {
      key: 'phone',
      name: 'Phone Number',
      label: 'Phone Number',
      type: 'text',
      required: false,
      placeholder: '+1 234 567 8900'
    },
    {
      key: 'department',
      name: 'Department',
      label: 'Department',
      type: 'select',
      required: true,
      placeholder: 'Select department',
      options: ['Sales', 'Marketing', 'HR', 'Finance', 'IT']
    },
    {
      key: 'position',
      name: 'Position',
      label: 'Position',
      type: 'text',
      required: true,
      placeholder: 'e.g., Senior Developer'
    },
    {
      key: 'joinDate',
      name: 'Join Date',
      label: 'Join Date',
      type: 'date',
      required: true,
      placeholder: 'Select join date'
    },
    {
      key: 'status',
      name: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      placeholder: 'Select status',
      options: ['Active', 'Inactive', 'On Leave']
    },
    {
      key: 'baseSalary',
      name: 'Base Salary',
      label: 'Base Salary',
      type: 'number',
      required: false,
      placeholder: 'e.g., 50000'
    }
  ];

  constructor(private message: NzMessageService) {}

  ngOnInit(): void {
    this.updateFormMode();
  }

  ngOnChanges(): void {
    this.updateFormMode();
  }

  private updateFormMode(): void {
    this.formMode = {
      mode: this.mode,
      title: this.mode === 'create' ? 'Add New Employee' : 'Edit Employee'
    };
  }

  onFormSubmit(formData: Record<string, unknown>): void {
    // Generate initials from full name
    const fullName = formData['fullName'] as string;
    const initials = fullName
      ? fullName
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '';

    // Generate avatar color based on initials
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068'];
    const avatarColor = colors[initials.charCodeAt(0) % colors.length];

    // Prepare employee data
    const employeeData: Employee = {
      ...formData,
      initials,
      avatarColor,
      createdAt: this.mode === 'create' ? new Date() : this.employee?.createdAt,
      updatedAt: new Date()
    } as Employee;

    this.submit.emit(employeeData);
  }

  get employeeData(): Record<string, unknown> {
    return (this.employee || {}) as Record<string, unknown>;
  }

  onFormCancel(): void {
    console.log('Employee form cancel clicked');
    this.cancel.emit();
  }
}
