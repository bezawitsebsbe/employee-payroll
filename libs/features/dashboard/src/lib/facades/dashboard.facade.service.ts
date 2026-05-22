import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, map, of, combineLatest } from 'rxjs';
import { tap, catchError, take } from 'rxjs/operators';
import { DashboardApiService } from '../api/dashboard.service';
import {
  LoadDashboardStatsSuccess,
  LoadRecentActivitiesSuccess,
  LoadRecentActivitiesFailure,
  AddActivity,  
  ClearActivities,
  UpdateStats
} from '../store/action/dashboard.action';
import { DashboardState } from '../store/state/dashboard.state';
import { DashboardStats, ActivityItem } from '../models/dashboard.model';


@Injectable({
  providedIn: 'root'
})
export class DashboardFacadeService {
  // Observable properties from store
  stats$!: Observable<DashboardStats | null>;
  recentActivities$!: Observable<ActivityItem[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private store: Store,
    private dashboardApi: DashboardApiService
  ) {
    // Initialize store properties in constructor
    this.stats$ = this.store.select(DashboardState.stats);
    this.recentActivities$ = this.store.select(DashboardState.recentActivities);
    this.loading$ = this.store.select(DashboardState.loading);
    this.error$ = this.store.select(DashboardState.error);
  }

  // Initialize dashboard (load all required data)
  initializeDashboard(): void {
    console.log(' Initializing dashboard with payroll data...');
    
    // Load employees first, then stats
    this.loadEmployeesForStats();
    
    // Trigger payroll data loading through dashboard API (this loads payroll records)
    this.dashboardApi.getDashboardStatsData().pipe(
      take(1)
    ).subscribe({
      next: (stats) => {
        console.log(' Dashboard API loaded initial stats:', stats);
        // Now load the dashboard stats with real data
        this.loadDashboardStats();
      },
      error: (error) => {
        console.log('  Dashboard API failed, loading stats with defaults:', error);
        // Still load stats even if API fails
        this.loadDashboardStats();
      }
    });
    
    // Load activities
    this.loadRecentActivities();
  }

  // Load dashboard statistics
  loadDashboardStats(): void {
    console.log(' Loading dashboard stats with real data...');
    
    // Combine data from all facades
    combineLatest([
      this.getTotalEmployees(),
      this.getTotalPayroll(),
      this.getTotalDeductions()
    ]).pipe(
      take(1)
    ).subscribe({
      next: ([totalEmployees, totalPayroll, totalDeductions]) => {
        console.log(' Dashboard stats loaded with real data:', {
          totalEmployees,
          totalPayroll,
          totalDeductions
        });
        
        const realStats: DashboardStats = {
          id: 'main',
          totalEmployees: totalEmployees || 0,
          activeEmployees: totalEmployees || 0,
          totalPayroll: totalPayroll || 0,
          thisMonthPayroll: totalPayroll || 0, // Using total as this month for now
          totalDeductions: totalDeductions || 0,
          attendanceRate: 95, // Default value for demo
          pendingTasks: 0,
          timestamp: new Date()
        };
        
        // Update state with real data
        this.store.dispatch(new LoadDashboardStatsSuccess({ stats: realStats }));
      },
      error: (error) => {
        console.error(' Error loading dashboard stats, using defaults:', error);
        
        // Fallback stats if facades fail
        const fallbackStats: DashboardStats = {
          id: 'main',
          totalEmployees: 0,
          activeEmployees: 0,
          totalPayroll: 0,
          thisMonthPayroll: 0,
          totalDeductions: 0,
          attendanceRate: 95,
          pendingTasks: 0,
          timestamp: new Date()
        };
        
        this.store.dispatch(new LoadDashboardStatsSuccess({ stats: fallbackStats }));
      }
    });
  }

  // Get total employees from dashboard API (which already calculates from employee records)
  getTotalEmployees(): Observable<number> {
    return this.dashboardApi.getDashboardStatsData().pipe(
      map((stats) => {
        console.log('📊 Dashboard - Total Employees from API:', stats.totalEmployees);
        return stats.totalEmployees || 0;
      }),
      catchError((error) => {
        console.log('📊 Dashboard API not available for employees, using fallback:', error);
        return of(0);
      })
    );
  }

  // Get total payroll from dashboard API (which already calculates from payroll records)
  getTotalPayroll(): Observable<number> {
    return this.dashboardApi.getDashboardStatsData().pipe(
      map((stats) => {
        console.log(' Dashboard - Total Payroll from API:', stats.totalPayroll);
        return stats.totalPayroll || 0;
      }),
      catchError((error) => {
        console.log(' Dashboard API not available for payroll, using fallback:', error);
        return of(0);
      })
    );
  }

  // Get total deductions from dashboard API
  getTotalDeductions(): Observable<number> {
    return this.dashboardApi.getDashboardStatsData().pipe(
      map((stats) => {
        console.log(' Dashboard - Total Deductions from API:', stats.totalDeductions);
        return stats.totalDeductions || 0;
      }),
      catchError((error) => {
        console.log(' Dashboard API not available for deductions, using fallback:', error);
        return of(0);
      })
    );
  }

  // Load employees for stats (ensure employee state is populated)
  loadEmployeesForStats(): void {
    console.log(' Dashboard - Loading employees for stats via store dispatch');
    // Load employees using store dispatch
    try {
      this.store.dispatch({ type: '[EmployeeState] LoadEmployees' });
    } catch (error) {
      console.log(' Employee state loading failed, using defaults');
    }
  }

  // Load recent activities
  loadRecentActivities(): void {
    console.log(' Dashboard: Loading recent activities...');
    // Load real data from API with fallback
    this.dashboardApi.getActivitiesData().pipe(
      tap((activities) => {
        console.log(' Loaded activities from API:', activities);
        // Update state with real data
        this.store.dispatch(new LoadRecentActivitiesSuccess({ activities }));
      }),
      catchError((error) => {
        console.error(' Failed to load activities from API, using empty list:', error);
        // Dispatch failure action with empty activities
        this.store.dispatch(new LoadRecentActivitiesFailure({ error: 'Failed to load activities' }));
        return of([]);
      })
    ).subscribe();
  }

  // Add new activity
 addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const activityWithMeta = { ...activity, id: Date.now().toString(), timestamp: new Date() };
    
    console.log(' Dashboard: Adding activity:', activityWithMeta);
    
    //  Call API first, then update state
    this.dashboardApi.addActivityData(activityWithMeta).pipe(
      tap(() => {
        console.log(' Activity added to API, refreshing activities...');
        // Refresh activities list to get latest data
        this.loadRecentActivities();
      }),
      catchError((error) => {
        console.error(' Failed to add activity to API, using local state only:', error);
        // Still update local state even if API fails
        this.store.dispatch(new AddActivity({ activity: activityWithMeta }));
        return of();
      })
    ).subscribe();
  }

  // Update dashboard stats
  updateStats(stats: Partial<DashboardStats>): void {
    this.store.dispatch(new UpdateStats({ stats }));
  }

  // Clear all activities
  clearActivities(): void {
    this.store.dispatch(new ClearActivities());
  }

  // Activity tracking methods
  trackEmployeeLogin(employeeName: string, employeeId: string): void {
    this.addActivity({
      type: 'employee',
      title: 'Employee Login',
      description: `${employeeName} logged in`,
      color: 'blue',
      icon: 'user'
    });
  }

  trackPayrollActivity(description: string, amount?: number): void {
    console.log('Tracking payroll activity:', description, amount);
    this.addActivity({
      type: 'payroll',
      title: 'Payroll Processed',
      description,
      color: 'green',
      icon: 'dollar'
    });
  }

  trackPayrollDeletion(description: string, amount?: number): void {
    console.log('Tracking payroll deletion:', description, amount);
    this.addActivity({
      type: 'payroll',
      title: 'Payroll Deleted',
      description,
      color: 'red',
      icon: 'delete'
    });
    
    // Update statistics to reflect deletion
    this.updateStatsForPayrollDeletion(amount || 0);
  }

  updateStatsForPayrollDeletion(deletedAmount: number): void {
    // Get current stats and update them
    this.stats$.subscribe(currentStats => {
      if (currentStats) {
        const updatedStats = {
          totalPayroll: Math.max(0, (currentStats.totalPayroll || 0) - deletedAmount),
          thisMonthPayroll: Math.max(0, (currentStats.thisMonthPayroll || 0) - deletedAmount)
        };
        this.updateStats(updatedStats);
      }
    }).unsubscribe();
  }

  trackAttendanceCheckIn(employeeName: string, employeeId: string): void {
    this.addActivity({
      type: 'attendance',
      title: 'Employee Check-In',
      description: `${employeeName} checked in`,
      color: 'yellow',
      icon: 'clock-circle'
    });
  }

  trackAttendanceCheckOut(employeeName: string, employeeId: string, workingHours?: string): void {
    this.addActivity({
      type: 'attendance',
      title: 'Employee Check-Out',
      description: `${employeeName} checked out (${workingHours})`,
      color: 'yellow',
      icon: 'clock-circle'
    });
  }

  trackEmployeeAdded(employeeName: string, employeeId: string): void {
    console.log(' Dashboard: Tracking employee added:', employeeName, employeeId);
    this.addActivity({
      type: 'employee',
      title: 'New Employee Added',
      description: `${employeeName} joined the team`,
      color: 'green',
      icon: 'user-add'
    });
  }

  trackEmployeeUpdated(employeeName: string, employeeId: string): void {
    this.addActivity({
      type: 'employee',
      title: 'Employee Updated',
      description: `${employeeName}'s information was updated`,
      color: 'blue',
      icon: 'edit'
    });
  }

  trackEmployeeDeleted(employeeName: string, employeeId: string): void {
    this.addActivity({
      type: 'employee',
      title: 'Employee Deleted',
      description: `${employeeName} removed from system`,
      color: 'red',
      icon: 'user-delete'
    });
  }

  trackSystemAction(action: string, description: string): void {
    this.addActivity({
      type: 'system',
      title: action,
      description,
      color: 'purple',
      icon: 'setting'
    });
  }
}
