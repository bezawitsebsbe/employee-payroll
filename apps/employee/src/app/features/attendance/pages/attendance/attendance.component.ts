import { Component, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { of, combineLatest } from 'rxjs';
import { map, take, startWith, shareReplay, filter as filterOperator } from 'rxjs/operators';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { AttendanceFacadeService } from '../../facades/attendance.facade.service';
import { EmployeeSimpleFacade } from '../../../employee/facades/employee-simple.facade';
import { EntityTableComponent, EntitySetting } from '@employee-payroll/entity';
import { attendanceTableConfig } from '../../components/attendance-table-config/attendance-table-config';


@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzSelectModule,
    NzInputModule,
    NzTagModule,
    NzCardModule,
    NzIconModule,
    EntityTableComponent
  ],
  providers: [AttendanceFacadeService, NzMessageService],
})
export class AttendanceComponent {
  facade = inject(AttendanceFacadeService);
  employeeFacade = inject(EmployeeSimpleFacade);
  cdr = inject(ChangeDetectorRef);
  message = inject(NzMessageService);

  // NGXS as single source of truth - use store directly
  // Loading guard signals
  checkingIn = signal(false);
  checkingOut = signal(false);
  resetting = signal(false);

  // Observable data
  attendanceData$ = this.facade.attendanceData$;
  employeeData$ = this.employeeFacade.employees$;

  // Table configuration
  tableConfig = attendanceTableConfig;
  tableSetting: EntitySetting = {
    identity: 'employeeId',
    showDetail: false,
    visibleColumns: attendanceTableConfig.columns || [],
    primaryColumn: {
      key: 'fullName',
      name: 'Employee',
      label: 'Employee',
      type: 'text',
      width: '200px',
      sortable: true,
      hideSort: false,
      tdClass: '',
      onChild: false
    },
    actions: [],
    group: [],
    showTabs: true,  // ✅ Enable tabs
    showFilters: true,  // ✅ Enable filters
    tabType: 'attendance'  // ✅ Custom tab type for attendance
  };
  attendanceSearchTerm = signal('');
  attendanceDepartmentFilter = signal<string | null>(null);
  attendanceStatusFilter = signal<string | null>(null);
  currentTabStatus = signal<'present' | 'absent' | 'all'>('all');
  
  // Observables for reactive filtering
  currentTabStatus$ = toObservable(this.currentTabStatus);
  attendanceSearchTerm$ = toObservable(this.attendanceSearchTerm);
  attendanceDepartmentFilter$ = toObservable(this.attendanceDepartmentFilter);
  attendanceStatusFilter$ = toObservable(this.attendanceStatusFilter);

  // Real employee data from Firestore
  employees$ = this.employeeFacade.employees$;
  employeesLoading$ = this.employeeFacade.employeesLoading$;

  // NGXS reactive attendance map using RxJS
  attendanceMap$ = this.attendanceData$.pipe(
    map((data: any[]) => {
      const attendanceRecordMap: Record<string, any> = {};

      data.forEach((att) => {
        const existing = attendanceRecordMap[att.employeeId];

        if (!existing) {
          attendanceRecordMap[att.employeeId] = att;
        } else {
          // ✅ Handle multiple records: prefer checked-in over not checked-in
          const existingHasCheckIn =
            existing.checkin && existing.checkin !== '-';
          const newHasCheckIn = att.checkin && att.checkin !== '-';

          if (newHasCheckIn && !existingHasCheckIn) {
            // New record has check-in, old doesn't - use new
            attendanceRecordMap[att.employeeId] = att;
          } else if (newHasCheckIn && existingHasCheckIn) {
            // Both have check-in - pick latest by checkin time
            const existingTime = new Date(
              `1970-01-01 ${existing.checkin}`,
            ).getTime();
            const newTime = new Date(`1970-01-01 ${att.checkin}`).getTime();

            if (newTime > existingTime) {
              attendanceRecordMap[att.employeeId] = att;
            }
          }
          // If neither has check-in, keep existing (doesn't matter which)
        }
      });

      return attendanceRecordMap;
    }),
  );

  // Reactive attendance summary using RxJS
  attendanceSummaryData$ = this.attendanceData$.pipe(
    map((data: any[]) => {
      console.log('🔍 Attendance Summary Update - Data:', data);

      const employees = this.getEmployees();
      console.log('🔍 Employees:', employees);

      // Count present and absent based on current attendance state
      let presentCount = 0;
      let absentCount = 0;

      employees.forEach((emp: any) => {
        // Find attendance record for this employee - prioritize checked-in records
        const attendanceRecords = data.filter(
          (a: any) => a.employeeId === emp.id,
        );

        // Pick the best record: prefer checked-in over not checked-in
        let attendanceRecord = null;
        if (attendanceRecords.length > 0) {
          // First, try to find a record with actual check-in
          attendanceRecord = attendanceRecords.find(
            (a: any) => a.checkin && a.checkin !== '-',
          );

          // If no checked-in record found, use the first available record
          if (!attendanceRecord) {
            attendanceRecord = attendanceRecords[0];
          }
        }

        console.log(`👤 Employee ${emp.fullName} (${emp.id}):`, {
          status: emp.status,
          allRecords: attendanceRecords,
          selectedRecord: attendanceRecord,
          checkin: attendanceRecord?.checkin,
          recordsCount: attendanceRecords.length,
        });

        // Skip inactive employees from attendance counts
        if (emp.status !== 'Active') {
          console.log(`⏸️ Skipping inactive employee: ${emp.fullName}`);
          return;
        }

        // Determine status based on attendance record
        if (
          !attendanceRecord ||
          !attendanceRecord.checkin ||
          attendanceRecord.checkin === '-'
        ) {
          // No check-in = Absent
          absentCount++;
          console.log(`❌ ${emp.fullName} is ABSENT (no check-in)`);
        } else {
          // Has check-in = Present (regardless of checkout status)
          presentCount++;
          console.log(
            `✅ ${emp.fullName} is PRESENT (has check-in: ${attendanceRecord.checkin})`,
          );
        }
      });

      const total = employees.filter(
        (emp: any) => emp.status === 'Active',
      ).length;

      console.log('📊 Attendance Summary Result:', {
        totalEmployees: employees.length,
        activeEmployees: total,
        present: presentCount,
        absent: absentCount,
        attendanceRecords: data.length,
      });

      return {
        present: presentCount,
        absent: absentCount,
        total: total,
      };
    }),
  );

  // Computed property for filtered employees
  filteredEmployees = computed(() => {
    let employees = this.getEmployees();

    // Search filter
    const search = this.attendanceSearchTerm();
    if (search) {
      employees = employees.filter((emp: any) =>
        emp.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Department filter
    const dept = this.attendanceDepartmentFilter();
    if (dept) {
      employees = employees.filter((emp: any) => emp.department === dept);
    }

    // Status filter based on current tab
    const currentStatus = this.currentTabStatus();
    if (currentStatus !== 'all') {
      employees = employees.filter((emp: any) => {
        const attendance = this.getEmployeeAttendance(emp.id);
        return attendance?.status?.toLowerCase() === currentStatus;
      });
    }

    return employees;
  });

  // Helper method to get employee attendance
  private getEmployeeAttendance(employeeId: string): any {
    let attendance: any = null;
    this.attendanceMap$.pipe(take(1)).subscribe(map => {
      attendance = map[employeeId] || null;
    }).unsubscribe();
    return attendance;
  }

  // Tab change methods
  showPresentEmployees() {
    this.currentTabStatus.set('present');
  }

  showAbsentEmployees() {
    this.currentTabStatus.set('absent');
  }

  showAllEmployees() {
    this.currentTabStatus.set('all');
  }

  constructor() {
    this.employeeFacade.loadEmployees();
  }

  ngOnInit() {
    this.employeeFacade.loadEmployees();
    this.facade.checkingIn$.subscribe((val) => this.checkingIn.set(val));
    this.facade.checkingOut$.subscribe((val) => this.checkingOut.set(val));

    this.attendanceData$.pipe(take(1)).subscribe((data) => {
      if (!data || data.length === 0) {
        console.log('🚀 First visit - loading attendance data...');
        this.facade.loadAttendanceData();
      } else {
        console.log(
          '📊 Attendance data already exists, preserving current state',
        );
      }
    });
  }

  // Helper method to get current employees synchronously
  private getEmployees(): any[] {
    let employees: any[] = [];
    this.employees$.subscribe((emp) => (employees = emp || [])).unsubscribe();
    return employees;
  }

 

  checkIn(employeeId: string) {
    this.facade.checkIn(employeeId)?.subscribe();
  }

  checkOut(attendanceId: string | null) {
    if (!attendanceId) return;
    this.facade.checkOut(attendanceId)?.subscribe();
  }

  

  // Filter and clear methods
  filterAttendance() {
    console.log('Filters applied:', {
      search: this.attendanceSearchTerm(),
      department: this.attendanceDepartmentFilter(),
      status: this.attendanceStatusFilter(),
    });
  }

  clearFilters() {
    this.attendanceSearchTerm.set('');
    this.attendanceDepartmentFilter.set(null);
    this.attendanceStatusFilter.set(null);
  }

  searchAttendance(term: string) {
    this.attendanceSearchTerm.set(term);
  }

  filterByDepartment(dept: string) {
    this.attendanceDepartmentFilter.set(dept);
  }

  filterByStatus(status: string) {
    this.attendanceStatusFilter.set(status);
  }

  exportAttendance() {
    const employees = this.getEmployees();
    const attendanceData = employees.map((emp: any) => ({
      employee: emp.fullName,
      employeeId: emp.empId || emp.id,
      department: emp.department,
      // Simple attendance record since we don't have getEmployeeAttendance method
      checkIn: '-',
      checkOut: '-',
      workingHours: '0h 0m',
      status: 'Absent',
    }));

    console.log('Exporting attendance data:', attendanceData);
    alert('Attendance data exported to console');
  }

  resetAllAttendance() {
    if (
      confirm(
        'Are you sure you want to reset all attendance records for today?',
      )
    ) {
      this.facade.resetAttendance()?.subscribe(() => {
        this.cdr.detectChanges();
        alert('All attendance records have been reset.');
      });
    }
  }

  refreshAttendanceData() {
    console.log('🔄 Manually refreshing attendance data...');
    this.facade.loadAttendanceData();
  }

  // Entity table methods
  onEntityAction(action: string, data: any) {
    console.log('Entity action:', action, data);
    
    switch (action) { 
      case 'checkin':
        this.checkIn(data.id || data.employeeId);
        break;
      case 'checkout':
        this.checkOut(data.id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  onFiltersChange(filters: any) {
    console.log('Filters changed:', filters);
    
    // Handle search filter
    if (filters.search !== undefined) {
      this.attendanceSearchTerm.set(filters.search);
    }
    
    // Handle other filters if needed
    if (filters.department) {
      this.attendanceDepartmentFilter.set(filters.department);
    }
    
    if (filters.status) {
      this.attendanceStatusFilter.set(filters.status);
    }
  }

  // Observable property for table data
  attendanceTableData$ = combineLatest([
    this.attendanceMap$,
    this.employees$,
    this.currentTabStatus$,
    this.attendanceSearchTerm$,
    this.attendanceDepartmentFilter$,
    this.attendanceStatusFilter$
  ]).pipe(
    map(([attendanceMap, employees, currentStatus, searchTerm, departmentFilter, statusFilter]: [any, any[], string, string, string | null, string | null]) => {
      console.log('📊 Table Data Update - Attendance Map:', attendanceMap);
      console.log('👥 Table Data Update - Employees:', employees);
      console.log('📊 Current Tab Status:', currentStatus);
      console.log('🔍 Search Term:', searchTerm);
      
      if (!employees || employees.length === 0) {
        return {
          items: [],
          totalItems: 0,
          loading: false
        };
      }
      
      // Apply filters before creating records
      let filteredEmps = [...employees];
      
      // Tab filtering
      if (currentStatus !== 'all') {
        filteredEmps = filteredEmps.filter((emp: any) => {
          const attendance = attendanceMap[emp.id];
          const status = attendance?.status || 'Absent';
          console.log(`👤 Employee ${emp.fullName} - Status: ${status}`);
          return status.toLowerCase() === currentStatus;
        });
      }
      
      // Search filtering
      if (searchTerm) {
        filteredEmps = filteredEmps.filter((emp: any) =>
          emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Department filtering
      if (departmentFilter) {
        filteredEmps = filteredEmps.filter((emp: any) =>
          emp.department === departmentFilter
        );
      }
      
      console.log('👥 Final Filtered Employees Count:', filteredEmps.length);
      
      const attendanceRecords: any[] = [];
      
      filteredEmps.forEach((emp: any) => {
        const rawAttendance = attendanceMap[emp.id];

        const attendance = {
          id: rawAttendance?.id || null,
          employeeId: emp.id,

          // ✅ ALWAYS include employee data
          fullName: emp.fullName,
          department: emp.department,

          // ✅ Attendance fields
          checkin: rawAttendance?.checkin || '-',
          checkout: rawAttendance?.checkout || '-',
          hours: rawAttendance?.hours || '0h 0m',

          // ✅ IMPORTANT
          status: rawAttendance?.checkin && rawAttendance?.checkin !== '-'
            ? 'Present'
            : 'Absent'
        };
        attendanceRecords.push(attendance);
      });

      console.log('📋 Final Table Records:', attendanceRecords);

      return {
        items: attendanceRecords,
        totalItems: attendanceRecords.length,
        loading: false
      };
    }),
    startWith({ items: [], totalItems: 0, loading: false }),
    filterOperator((data: any) => data !== null),
    shareReplay(1)
  );
}
