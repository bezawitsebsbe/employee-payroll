import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AttendanceApiService } from '../../api/attendance.service';
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
} from '../action/attendance.action';
import { EmployeeAttendance } from '../../models/attendance.model';

export interface AttendanceStateModel {
  attendanceData: EmployeeAttendance[];
  selectedAttendance: EmployeeAttendance | null;
  attendanceByEmployeeId: EmployeeAttendance[];
  attendanceDataLoading: boolean;
  attendanceLoading: boolean;
  attendanceByEmployeeIdLoading: boolean;
  creatingAttendanceRecord: boolean;
  updatingAttendanceRecord: boolean;
  deletingAttendanceRecord: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
}

@Injectable()
@State<AttendanceStateModel>({
  name: 'AttendanceState',
  defaults: {
    attendanceData: [],
    selectedAttendance: null,
    attendanceByEmployeeId: [],
    attendanceDataLoading: false,
    attendanceLoading: false,
    attendanceByEmployeeIdLoading: false,
    creatingAttendanceRecord: false,
    updatingAttendanceRecord: false,
    deletingAttendanceRecord: false,
    checkingIn: false,
    checkingOut: false,
  },
})
export class AttendanceState {
  success = 'SYSTEM.SUCCESS';

  @Selector() public static attendanceData(
    state: AttendanceStateModel,
  ): EmployeeAttendance[] {
    return state.attendanceData;
  }

  @Selector() public static selectedAttendance(
    state: AttendanceStateModel,
  ): EmployeeAttendance | null {
    return state.selectedAttendance;
  }

  @Selector() public static attendanceByEmployeeId(
    state: AttendanceStateModel,
  ): EmployeeAttendance[] {
    return state.attendanceByEmployeeId;
  }

  @Selector() public static attendanceDataLoading(
    state: AttendanceStateModel,
  ): boolean {
    return state.attendanceDataLoading;
  }

  @Selector() public static attendanceLoading(
    state: AttendanceStateModel,
  ): boolean {
    return state.attendanceLoading;
  }

  @Selector() public static attendanceByEmployeeIdLoading(
    state: AttendanceStateModel,
  ): boolean {
    return state.attendanceByEmployeeIdLoading;
  }

  @Selector() public static creatingAttendanceRecord(
    state: AttendanceStateModel,
  ): boolean {
    return state.creatingAttendanceRecord;
  }

  @Selector() public static updatingAttendanceRecord(
    state: AttendanceStateModel,
  ): boolean {
    return state.updatingAttendanceRecord;
  }

  @Selector() public static deletingAttendanceRecord(
    state: AttendanceStateModel,
  ): boolean {
    return state.deletingAttendanceRecord;
  }

  @Selector() public static checkingIn(state: AttendanceStateModel): boolean {
    return state.checkingIn;
  }

  @Selector() public static checkingOut(state: AttendanceStateModel): boolean {
    return state.checkingOut;
  }

  constructor(
    private readonly attendanceApi: AttendanceApiService,
    private readonly notification: NzNotificationService,
    private readonly router: Router,
  ) {}

  @Action(LoadAttendanceData) loadAttendanceData({
    patchState,
  }: StateContext<AttendanceStateModel>): Observable<any> {
    patchState({
      attendanceDataLoading: true,
    });

    return this.attendanceApi.getAttendanceData().pipe(
      tap((attendanceData: EmployeeAttendance[]) => {
        patchState({
          attendanceDataLoading: false,
          attendanceData: attendanceData,
        });
      }),
      catchError((error) =>
        of(
          patchState({
            attendanceDataLoading: false,
          }),
        ),
      ),
    );
  }

  @Action(LoadAttendance) loadAttendance(
    { patchState }: StateContext<AttendanceStateModel>,
    { payload }: LoadAttendance,
  ): Observable<any> {
    if (!payload) {
      return of(
        patchState({
          selectedAttendance: null,
        }),
      );
    }

    patchState({
      attendanceLoading: true,
    });

    return this.attendanceApi.getAttendance(payload).pipe(
      tap((attendance: EmployeeAttendance | null) => {
        patchState({
          attendanceLoading: false,
          selectedAttendance: attendance,
        });
      }),
      catchError((error) =>
        of(
          patchState({
            attendanceLoading: false,
            selectedAttendance: null,
          }),
        ),
      ),
    );
  }

  @Action(LoadAttendanceByEmployeeId) loadAttendanceByEmployeeId(
    { patchState }: StateContext<AttendanceStateModel>,
    { payload }: LoadAttendanceByEmployeeId,
  ): Observable<any> {
    if (!payload) {
      return of(
        patchState({
          attendanceByEmployeeId: [],
        }),
      );
    }

    patchState({
      attendanceByEmployeeIdLoading: true,
    });

    return this.attendanceApi.getAttendanceByEmployeeId(payload).pipe(
      tap((attendanceData: EmployeeAttendance[]) => {
        patchState({
          attendanceByEmployeeIdLoading: false,
          attendanceByEmployeeId: attendanceData,
        });
      }),
      catchError((error) =>
        of(
          patchState({
            attendanceByEmployeeIdLoading: false,
            attendanceByEmployeeId: [],
          }),
        ),
      ),
    );
  }

  @Action(CreateAttendanceRecord) createAttendanceRecord(
    { patchState, getState, dispatch }: StateContext<AttendanceStateModel>,
    { payload }: CreateAttendanceRecord,
  ): Observable<any> {
    if (!payload) {
      return of();
    }

    patchState({
      creatingAttendanceRecord: true,
    });

    return this.attendanceApi.createAttendanceRecord(payload).pipe(
      tap((createdAttendance: EmployeeAttendance) => {
        const currentAttendanceData = getState().attendanceData;
        patchState({
          creatingAttendanceRecord: false,
          attendanceData: [...currentAttendanceData, createdAttendance],
        });

        this.notification.success(
          this.success,
          'Attendance Record Created Successfully',
        );
        dispatch(new LoadAttendanceData()); // Refresh the list
      }),
      catchError((error) => {
        this.notification.error(
          'SYSTEM.ERROR',
          'Error creating attendance record',
        );
        return of(patchState({ creatingAttendanceRecord: false }));
      }),
    );
  }

  @Action(UpdateAttendanceRecord) updateAttendanceRecord(
    { patchState, getState }: StateContext<AttendanceStateModel>,
    { payload }: UpdateAttendanceRecord,
  ): Observable<any> {
    if (!payload) {
      return of();
    }

    patchState({
      updatingAttendanceRecord: true,
    });

    return this.attendanceApi
      .updateAttendanceRecord(payload.id, payload.changes)
      .pipe(
        tap((updatedAttendance: EmployeeAttendance) => {
          const currentAttendanceData = getState().attendanceData;
          const updatedAttendanceData = currentAttendanceData.map((record) =>
            record.id === payload.id
              ? { ...record, ...payload.changes }
              : record,
          );

          patchState({
            updatingAttendanceRecord: false,
            attendanceData: updatedAttendanceData,
            selectedAttendance: updatedAttendance,
          });

          this.notification.success(
            this.success,
            'Attendance Record Updated Successfully',
          );
        }),
        catchError((error) => {
          this.notification.error(
            'SYSTEM.ERROR',
            'Error updating attendance record',
          );
          return of(
            patchState({
              updatingAttendanceRecord: false,
            }),
          );
        }),
      );
  }

  @Action(DeleteAttendanceRecord) deleteAttendanceRecord(
    { patchState, getState }: StateContext<AttendanceStateModel>,
    { payload }: DeleteAttendanceRecord,
  ): Observable<any> {
    if (!payload) {
      return of();
    }

    patchState({
      deletingAttendanceRecord: true,
    });

    return this.attendanceApi.deleteAttendanceRecord(payload).pipe(
      tap(() => {
        const currentAttendanceData = getState().attendanceData;
        const filteredAttendanceData = currentAttendanceData.filter(
          (record) => record.id !== payload,
        );

        patchState({
          deletingAttendanceRecord: false,
          attendanceData: filteredAttendanceData,
          selectedAttendance: null,
        });

        this.notification.success(
          this.success,
          'Attendance Record Deleted Successfully',
        );
      }),
      catchError((error) => {
        this.notification.error(
          'SYSTEM.ERROR',
          'Error deleting attendance record',
        );
        return of(
          patchState({
            deletingAttendanceRecord: false,
          }),
        );
      }),
    );
  }

  @Action(CheckIn) checkIn(
    { patchState, getState, dispatch }: StateContext<AttendanceStateModel>,
    { payload }: CheckIn,
  ): Observable<any> {
    if (!payload) return of(null);

    patchState({ checkingIn: true });

    return this.attendanceApi
      .checkIn(payload.employeeId, payload.employeeName, payload.department)
      .pipe(
        tap((createdRecord) => {
          const current = getState().attendanceData;

          patchState({
            checkingIn: false,
            attendanceData: [...current, createdRecord],
          });

          this.notification.success(this.success, `Check-in successful`);
        }),
        catchError(() => {
          patchState({ checkingIn: false });
          this.notification.error('SYSTEM.ERROR', 'Check-in failed');
          return of(null);
        }),
      );
  }

  @Action(CheckOut) checkOut(
    { patchState, getState }: StateContext<AttendanceStateModel>,
    { payload }: CheckOut,
  ): Observable<any> {
    if (!payload) return of(null);

    patchState({ checkingOut: true });

    return this.attendanceApi.checkOut(payload).pipe(
      tap((updatedRecord) => {
        const current = getState().attendanceData;

        const updated = current.map((r) =>
          r.id === payload ? updatedRecord : r,
        );

        patchState({
          checkingOut: false,
          attendanceData: updated,
        });

        this.notification.success(this.success, 'Check-out successful');
      }),
      catchError(() => {
        patchState({ checkingOut: false });
        this.notification.error('SYSTEM.ERROR', 'Check-out failed');
        return of(null);
      }),
    );
  }

  @Action(ResetAttendance) resetAttendance(
    { patchState, getState }: StateContext<AttendanceStateModel>
  ) {
    const state = getState();
    const today = new Date().toISOString().split('T')[0];
    
    const resetData = state.attendanceData.map((emp) => ({
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name, // ✅ Use only existing property from EmployeeAttendance model
      department: emp.department,
      checkin: '-',
      checkout: '-',
      hours: '0h 0m',
      status: 'Absent' as const
    }));

    // First update local state for immediate UI feedback
    patchState({
      attendanceData: resetData,
      checkingIn: false,
      checkingOut: false
    });

    // Then persist to backend with UPSERT for ALL employees
    return this.attendanceApi.resetDailyAttendance(today, resetData).pipe(
      tap(() => {
        this.notification.success(this.success, 'Attendance reset successful');
      }),
      catchError((error) => {
        console.error('Failed to reset attendance on backend:', error);
        this.notification.error(
          'SYSTEM.ERROR',
          'Failed to reset attendance. Changes reverted.'
        );
        // Revert to original data on failure
        patchState({
          attendanceData: state.attendanceData
        });
        return of();
      })
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private calculateHours(checkIn: string, checkOut: string): string {
    if (!checkIn || !checkOut) return '0h 0m';

    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();

    if (isNaN(start) || isNaN(end)) return '0h 0m'; 

    const diff = end - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }
}
