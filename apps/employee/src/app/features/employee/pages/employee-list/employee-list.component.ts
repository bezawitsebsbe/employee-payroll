import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { EntityTableComponent, EntityColumn, EntityAction, EntityTableData, EntityConfig, EntitySetting } from '@employee-payroll/entity';
import { Employee } from '../../models/employee.model';
import { EmployeeSimpleFacade } from '../../facades/employee-simple.facade';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    EntityTableComponent
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  loading = false;
  
  private router = inject(Router);
  private facade = inject(EmployeeSimpleFacade);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Table configurations
  tableColumns: EntityColumn[] = [
    {
      key: 'empId',
      name: 'Employee ID',
      label: 'Employee ID',
      type: 'text',
      sortable: true,
      width: '120px'
    },
    {
      key: 'fullName',
      name: 'Full Name',
      label: 'Full Name',
      type: 'text',
      sortable: true,
      width: '200px'
    },
    {
      key: 'email',
      name: 'Email',
      label: 'Email',
      type: 'email',
      sortable: true,
      width: '250px'
    },
    {
      key: 'department',
      name: 'Department',
      label: 'Department',
      type: 'tag',
      sortable: true,
      width: '150px',
      tagColors: {
        'Sales': '#108ee9',
        'Marketing': '#87d068',
        'HR': '#f50',
        'Finance': '#2db7f5',
        'IT': '#722ed1'
      }
    },
    {
      key: 'position',
      name: 'Position',
      label: 'Position',
      type: 'text',
      sortable: true,
      width: '180px'
    },
    {
      key: 'status',
      name: 'Status',
      label: 'Status',
      type: 'tag',
      sortable: true,
      width: '100px',
      tagColors: {
        'Active': '#52c41a',
        'Inactive': '#ff4d4f',
        'On Leave': '#faad14'
      }
    },
    {
      key: 'joinDate',
      name: 'Join Date',
      label: 'Join Date',
      type: 'date',
      sortable: true,
      width: '120px'
    }
  ];


  // Table configurations
  tableActions: EntityAction[] = [
    {
      key: 'view',
      label: 'Detail',
      icon: 'eye',
      type: 'view',
      routerLink: (employee: Employee) => ['detail', employee.id || '']
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'delete',
      type: 'delete',
      callback: (employee: Employee) => this.confirmDelete(employee)
    }
  ];

  // Base table setting
  baseTableSetting: EntitySetting = {
    identity: 'id',
    primaryColumn: this.tableColumns[1], 
    actions: [],
    showFilters: true
  };

  // Table configuration
  tableSetting: EntitySetting = {
    ...this.baseTableSetting,
    visibleColumns: this.tableColumns
  };

  // Table config for entity-table
  tableConfig: EntityConfig = {
    ...this.baseTableSetting,
    visibleColumns: this.tableColumns,
    actions: this.tableActions
  };

  // Add Employee action for table header
  addEmployeeAction: EntityAction = {
    key: 'add',
    label: 'New Employee',
    icon: 'plus',
    type: 'primary',
    routerLink: () => ['./add']
  };

  // Table data
  tableData: EntityTableData = {
    items: [],
    totalItems: 0,
    currentPage: 1,
    pageSize: 10
  };

  ngOnInit(): void {
    console.log('');
    
    this.facade.loadEmployees();
    
    // Subscribe to employees from facade for automatic updates
    this.facade.employees$.pipe(takeUntil(this.destroy$)).subscribe((employees: Employee[]) => {
      this.updateTableData(employees);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEmployees(): void {
    this.loading = true;
    this.facade.loadEmployees();
  }

  private updateTableData(employees: Employee[]): void {
    this.tableData = {
      items: employees,
      totalItems: employees.length,
      currentPage: 1,
      pageSize: 10
    };
    this.loading = false;
  }


  onTableAction(event: { action: string; data: Employee }): void {
    console.log('🔥 onTableAction called with:', event);
    
    switch (event.action) {
      case 'view':
        console.log('View employee:', event.data);
        break;
      case 'delete':
        console.log('Delete employee:', event.data);
        this.confirmDelete(event.data);
        break;
      case 'detail':
        console.log('Detail action triggered for employee:', event.data.id);
        break;
      default:
        console.log('Unknown action:', event.action, event.data);
    }
  }

  onRowClick(employee: Employee): void {
    // Navigate to employee detail page when row is clicked
    this.router.navigate(['/employee/detail', employee.id]);
  }

  onFiltersChange(filters: any): void {
    console.log('Filters changed:', filters);
  }

  onSortChange(sort: any): void {
    console.log('Sort changed:', sort);
  }

  onPaginationChange(pagination: any): void {
    console.log('Pagination changed:', pagination);
  }

  confirmDelete(employee: Employee): void {
    if (confirm(`Are you sure you want to delete employee "${employee.fullName}"?`)) {
      this.facade.deleteEmployee(employee.id || '');
      this.message.success('Employee deleted successfully');
      
      // Refresh the employee list after a short delay
      setTimeout(() => {
        this.facade.loadEmployees();
      }, 1000);
    }
  }

}
