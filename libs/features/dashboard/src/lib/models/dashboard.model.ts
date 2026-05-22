export interface DashboardStats {
  id: string;
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  thisMonthPayroll: number;
  totalDeductions: number;
  attendanceRate: number;
  pendingTasks: number;
  timestamp?: Date;
}

export interface ActivityItem {
  id: string;
  type: 'employee' | 'payroll' | 'attendance' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'orange';
  icon?: string;
} 

export interface DashboardFilter {
  dateRange?: { start: Date; end: Date };
  department?: string;
  status?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}
