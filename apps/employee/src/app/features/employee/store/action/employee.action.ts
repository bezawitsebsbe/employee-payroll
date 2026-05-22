import { Employee } from '../../models/employee.model';
export class LoadEmployees {
  static readonly type = '[EmployeeState] LoadEmployees';
}
export class LoadEmployee {
  static readonly type = '[EmployeeState] LoadEmployee';
  constructor(public readonly payload?: string) {}
}

export class CreateEmployee {
  static readonly type = '[EmployeeState] CreateEmployee';
  constructor(public readonly payload?: Omit<Employee, 'id'>) {}
}

export class UpdateEmployee {
  static readonly type = '[EmployeeState] UpdateEmployee';
  constructor(public readonly payload?: { id: string; changes: Partial<any> }) {}
}

export class DeleteEmployee {
  static readonly type = '[EmployeeState] DeleteEmployee';
  constructor(public readonly payload?: string) {}
}