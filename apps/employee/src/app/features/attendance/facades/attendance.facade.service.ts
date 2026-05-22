import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import {
  LoadAttendanceData,
  LoadAttendance,
  LoadAttendanceByEmployeeId,
  CreateAttendanceRecord,
  UpdateAttendanceRecord,
  DeleteAttendanceRecord,
  CheckIn,
  CheckOut,
  ResetAttendance
} from '../store/action/attendance.action';
import { AttendanceState } from '../store/state/attendance.state';
import { DashboardFacadeService } from '@employee-payroll/features';
import { EmployeeSimpleFacade } from '../../employee/facades/employee-simple.facade';

@Injectable()
export class AttendanceFacadeService {
  attendanceData$: Observable<any[]>;
  selectedAttendance$: Observable<any>;
  attendanceByEmployeeId$: Observable<any[]>;
  attendanceDataLoading$: Observable<boolean>;
  attendanceLoading$: Observable<boolean>;
  attendanceByEmployeeIdLoading$: Observable<boolean>;
  creatingAttendanceRecord$: Observable<boolean>;
  updatingAttendanceRecord$: Observable<boolean>;
  deletingAttendanceRecord$: Observable<boolean>;
  checkingIn$: Observable<boolean>;
  checkingOut$: Observable<boolean>;

  constructor(
    private readonly store: Store,
    private dashboardService: DashboardFacadeService,
    private employeeFacade: EmployeeSimpleFacade,
  ) {
    this.attendanceData$ = this.store.select(AttendanceState.attendanceData);
    this.selectedAttendance$ = this.store.select(
      AttendanceState.selectedAttendance,
    );
    this.attendanceByEmployeeId$ = this.store.select(
      AttendanceState.attendanceByEmployeeId,
    );
    this.attendanceDataLoading$ = this.store.select(
      AttendanceState.attendanceDataLoading,
    );
    this.attendanceLoading$ = this.store.select(
      AttendanceState.attendanceLoading,
    );
    this.attendanceByEmployeeIdLoading$ = this.store.select(
      AttendanceState.attendanceByEmployeeIdLoading,
    );
    this.creatingAttendanceRecord$ = this.store.select(
      AttendanceState.creatingAttendanceRecord,
    );
    this.updatingAttendanceRecord$ = this.store.select(
      AttendanceState.updatingAttendanceRecord,
    );
    this.deletingAttendanceRecord$ = this.store.select(
      AttendanceState.deletingAttendanceRecord,
    );
    this.checkingIn$ = this.store.select(AttendanceState.checkingIn);
    this.checkingOut$ = this.store.select(AttendanceState.checkingOut);
  }

  loadAttendanceData(): void {
    this.store.dispatch(new LoadAttendanceData());
  }

  loadAttendance(id: string): void {
    this.store.dispatch(new LoadAttendance(id));
  }

  loadAttendanceByEmployeeId(employeeId: string): void {
    this.store.dispatch(new LoadAttendanceByEmployeeId(employeeId));
  }

  createAttendanceRecord(attendance: any): void {
    this.store.dispatch(new CreateAttendanceRecord(attendance));
  }

  updateAttendanceRecord(id: string, changes: any): void {
    this.store.dispatch(new UpdateAttendanceRecord({ id, changes }));
  }

  deleteAttendanceRecord(id: string): void {
    this.store.dispatch(new DeleteAttendanceRecord(id));
  }
  // ✅ CLEAN CHECK-IN
  checkIn(employeeId: string) {
    return combineLatest([this.employeeFacade.employees$]).pipe(
      take(1),
      tap(([employees]) => {
        const employee = employees.find((e: any) => e.id === employeeId);
        if (!employee) return;

        this.store
          .dispatch(
            new CheckIn({
              employeeId,
              employeeName: employee.fullName,
              department: employee.department,
            }),
          )
          .subscribe(() => {
            // ✅ AFTER SUCCESS
            this.dashboardService.trackAttendanceCheckIn(
              employee.fullName,
              employee.id,
            );
          });
      }),
    );
  }

  // ✅ CLEAN CHECK-OUT
  checkOut(attendanceId: string) {
    return combineLatest([
      this.employeeFacade.employees$,
      this.attendanceData$,
    ]).pipe(
      take(1),
      tap(([employees, attendanceData]) => {
        const attendance = attendanceData.find((a) => a.id === attendanceId);
        if (!attendance) return;

        const employee = employees.find((e) => e.id === attendance.employeeId);
        if (!employee) return;

        this.store.dispatch(new CheckOut(attendanceId)).subscribe(() => {
          const updated = this.store
            .selectSnapshot(AttendanceState.attendanceData)
            .find((a) => a.id === attendanceId);

          this.dashboardService.trackAttendanceCheckOut(
            employee.fullName,
            employee.id,
            updated?.hours || '0h 0m',
          );
        });
      }),
    );
  }

  resetAttendance() {
  return this.store.dispatch(new ResetAttendance()).pipe(
    tap(() => {
      this.dashboardService.trackSystemAction(
        'Attendance Reset',
        'All attendance records have been reset for today'
      );
    })
  );
}
}