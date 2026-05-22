import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { 
  NzIconModule
} from 'ng-zorro-antd/icon';
import { 
  NzButtonModule
} from 'ng-zorro-antd/button';
import { 
  NzCardModule
} from 'ng-zorro-antd/card';
import { 
  NzSpinModule
} from 'ng-zorro-antd/spin';
import { 
  NzEmptyModule
} from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DashboardFacadeService } from '../facades/dashboard.facade.service';
import { DashboardStats, ActivityItem } from '../models/dashboard.model';
import { Observable, Subject, } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzTagModule,
    NzButtonModule,
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
    CurrencyPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() sidebarItems: {
    label: string;
    icon: string;
    path: string;
    apps?: string[];
  }[] = [];
  @Input() currentApp = 'payroll'; // Will be set by route data

  // Expose facade observables to template
  dashboardStats$: Observable<DashboardStats | null>;
  recentActivities$: Observable<ActivityItem[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  totalEmployees$: Observable<number>;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardFacade: DashboardFacadeService,
    private route: ActivatedRoute,
  ) {
    this.dashboardStats$ = this.dashboardFacade.stats$;
    this.recentActivities$ = this.dashboardFacade.recentActivities$;
    this.loading$ = this.dashboardFacade.loading$;
    this.error$ = this.dashboardFacade.error$;
    this.totalEmployees$ = this.dashboardFacade.getTotalEmployees();
  }

  ngOnInit(): void {
    // Read currentApp from route data, fallback to default
    this.currentApp = this.route.snapshot.data?.['currentApp'] || 'employee';
    
    // Subscribe to route data changes
    this.route.data.subscribe(data => {
      this.currentApp = data?.['currentApp'] || 'employee';
      this.updateSidebarItems();
    });

    // Initialize dashboard data
    this.dashboardFacade.initializeDashboard();

    // Ensure Employee State is Loaded
    this.dashboardFacade.loadEmployeesForStats();

    // Subscribe to total employees for real-time updates
    this.dashboardFacade.getTotalEmployees().subscribe((count) => {
      // Total employees from facade: count
    });
  }

  private updateSidebarItems(): void {
    if (this.currentApp === 'payroll') {
      // Payroll app sidebar items
      this.sidebarItems = [
        { label: 'Dashboard', icon: '📊', path: '/dashboard' },
        { label: 'Payroll', icon: '💰', path: '/payroll' }
      ];
    } else {
      // Employee app sidebar items
      this.sidebarItems = [
        { label: 'Dashboard', icon: '📊', path: '/dashboard' },
        { label: 'Employee', icon: '👥', path: '/employees' },
        { label: 'Attendance', icon: '🕒', path: '/attendance' }
      ];
    }
    // Sidebar items set for app: sidebarItems
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Format activity time (e.g., "2 hours ago", "1 day ago")
  formatActivityTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  // Get activity color class
  getActivityColor(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: 'blue',
      green: 'green',
      orange: 'orange',
      purple: 'purple',
      red: 'red',
      yellow: 'yellow',
    };
    return colorMap[color] || 'blue';
  }

  // Get activity icon class based on type
  getActivityIconClass(type: string): string {
    return type;
  }

  // Get activity icon based on type
  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      employee: 'user-o',
      payroll: 'dollar-o',
      attendance: 'clock-circle-o',
      system: 'setting-o',
    };
    return iconMap[type] || 'info-circle-o';
  }

  // Get activity tag color based on type
  getActivityTagColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      employee: 'blue',
      payroll: 'green',
      attendance: 'orange',
      system: 'purple',
    };
    return colorMap[type] || 'default';
  }

  // Get activity type label
  getActivityTypeLabel(type: string): string {
    const labelMap: { [key: string]: string } = {
      employee: 'Employee',
      payroll: 'Payroll',
      attendance: 'Attendance',
      system: 'System',
    };
    return labelMap[type] || 'Other';
  }

  // Handle quick action button click
  onQuickAction(): void {
    this.dashboardFacade.trackSystemAction(
      'Quick Action',
      'User clicked quick action button',
    );
  }

  // Handle filter button click
  onFilter(): void {
    this.dashboardFacade.trackSystemAction(
      'Filter',
      'User clicked filter button',
    );
  }

  // Handle export button click
  onExport(): void {
    this.dashboardFacade.trackSystemAction(
      'Export',
      'User exported dashboard data',
    );
  }

  // Handle clear activities
  onClearActivities(): void {
    this.dashboardFacade.clearActivities();
  }

  // Refresh dashboard data
  onRefresh(): void {
    this.dashboardFacade.initializeDashboard();
    this.dashboardFacade.trackSystemAction(
      'Refresh',
      'Dashboard data refreshed',
    );
  }
}