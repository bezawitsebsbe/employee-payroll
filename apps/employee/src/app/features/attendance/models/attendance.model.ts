export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  checkin: string;
  checkout: string;
  hours: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
}
