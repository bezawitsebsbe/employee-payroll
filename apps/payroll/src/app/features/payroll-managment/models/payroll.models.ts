export interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  position: string;
  baseSalary: number;
  weeklyBonus: number;
  monthlyBonus: number;
  jobDoneBonus: number;
  deductions: number;
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollFormData {
  employeeName: string;
  employeeId: string;
  department: string;
  position: string;
  baseSalary: string;
  weeklyBonus: string;
  monthlyBonus: string;
  jobDoneBonus: string;
  deductions: string;
  netSalary: string;
  status: 'Pending' | 'Processed' | 'Paid';
}

export interface PayrollStatistics {
  totalPayroll: number;
  totalPayrollChange: string;
  totalBonuses: number;
  totalBonusesChange: string;
  deductions: number;
  deductionsChange: string;
  employees: number;
  employeesChange: string;
}

export interface PayrollFilter {
  searchTerm: string;
  selectedDepartment: string;
  status: string;
}

export interface PayrollState {
  payrollRecords: PayrollRecord[];
  statistics: PayrollStatistics;
  loading: boolean;
  error: string | null;
  selectedRecord: PayrollRecord | null;
  modalVisible: boolean;
  filter: PayrollFilter;
}

export enum PayrollActions {
  LOAD_PAYROLL_RECORDS = 'LOAD_PAYROLL_RECORDS',
  LOAD_PAYROLL_RECORDS_SUCCESS = 'LOAD_PAYROLL_RECORDS_SUCCESS',
  LOAD_PAYROLL_RECORDS_ERROR = 'LOAD_PAYROLL_RECORDS_ERROR',
  LOAD_STATISTICS = 'LOAD_STATISTICS',
  LOAD_STATISTICS_SUCCESS = 'LOAD_STATISTICS_SUCCESS',
  LOAD_STATISTICS_ERROR = 'LOAD_STATISTICS_ERROR',
  ADD_PAYROLL_RECORD = 'ADD_PAYROLL_RECORD',
  ADD_PAYROLL_RECORD_SUCCESS = 'ADD_PAYROLL_RECORD_SUCCESS',
  ADD_PAYROLL_RECORD_ERROR = 'ADD_PAYROLL_RECORD_ERROR',
  UPDATE_PAYROLL_RECORD = 'UPDATE_PAYROLL_RECORD',
  UPDATE_PAYROLL_RECORD_SUCCESS = 'UPDATE_PAYROLL_RECORD_SUCCESS',
  UPDATE_PAYROLL_RECORD_ERROR = 'UPDATE_PAYROLL_RECORD_ERROR',
  DELETE_PAYROLL_RECORD = 'DELETE_PAYROLL_RECORD',
  DELETE_PAYROLL_RECORD_SUCCESS = 'DELETE_PAYROLL_RECORD_SUCCESS',
  DELETE_PAYROLL_RECORD_ERROR = 'DELETE_PAYROLL_RECORD_ERROR',
  SELECT_RECORD = 'SELECT_RECORD',
  TOGGLE_MODAL = 'TOGGLE_MODAL',
  SET_FILTER = 'SET_FILTER',
  CLEAR_ERROR = 'CLEAR_ERROR'
}
