import { EmployeeAttendance } from '../../models/attendance.model';

export class LoadAttendanceData {
  static readonly type = '[AttendanceState] LoadAttendanceData';
}

export class LoadAttendance {
  static readonly type = '[AttendanceState] LoadAttendance';
  constructor(public readonly payload?: string) {}
}

export class LoadAttendanceByEmployeeId {
  static readonly type = '[AttendanceState] LoadAttendanceByEmployeeId';
  constructor(public readonly payload?: string) {}
}

export class CreateAttendanceRecord {
  static readonly type = '[AttendanceState] CreateAttendanceRecord';
  constructor(public readonly payload?: Omit<EmployeeAttendance, 'id'>) {}
}

export class UpdateAttendanceRecord {
  static readonly type = '[AttendanceState] UpdateAttendanceRecord';
  constructor(public readonly payload?: { id: string; changes: Partial<any> }) {}
}

export class DeleteAttendanceRecord {
  static readonly type = '[AttendanceState] DeleteAttendanceRecord';
  constructor(public readonly payload?: string) {}
}

export class CheckIn {
  static readonly type = '[AttendanceState] CheckIn';
  constructor(public readonly payload?: { employeeId: string; employeeName: string; department: string }) {}
}

export class CheckOut {
  static readonly type = '[AttendanceState] CheckOut';
  constructor(public readonly payload?: string) {}
}

export class ResetAttendance {
  static readonly type = '[Attendance] Reset';
}