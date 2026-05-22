import { DashboardStats, ActivityItem } from '../../models/dashboard.model';

// Load Dashboard Stats
export class LoadDashboardStats {
  static readonly type = '[Dashboard] Load Dashboard Stats';
}

export class LoadDashboardStatsSuccess {
  static readonly type = '[Dashboard] Load Dashboard Stats Success';
  constructor(public readonly payload?: { stats: DashboardStats }) {}
}

export class LoadDashboardStatsFailure {
  static readonly type = '[Dashboard] Load Dashboard Stats Failure';
  constructor(public readonly payload?: { error: string }) {}
}

// Load Recent Activities
export class LoadRecentActivities {
  static readonly type = '[Dashboard] Load Recent Activities';
}

export class LoadRecentActivitiesSuccess {
  static readonly type = '[Dashboard] Load Recent Activities Success';
  constructor(public readonly payload?: { activities: ActivityItem[] }) {}
}

export class LoadRecentActivitiesFailure {
  static readonly type = '[Dashboard] Load Recent Activities Failure';
  constructor(public readonly payload?: { error: string }) {}
}

// Add Activity
export class AddActivity {
  static readonly type = '[Dashboard] Add Activity';
  constructor(public readonly payload?: { activity: ActivityItem }) {}
}

// Clear Activities
export class ClearActivities {
  static readonly type = '[Dashboard] Clear Activities';
}

// Update Stats
export class UpdateStats {
  static readonly type = '[Dashboard] Update Stats';
  constructor(public readonly payload?: { stats: Partial<DashboardStats> }) {}
}

// Export all actions as a namespace for easier importing
export const DashboardActions = {
  LoadDashboardStats,
  LoadDashboardStatsSuccess,
  LoadDashboardStatsFailure,
  LoadRecentActivities,
  LoadRecentActivitiesSuccess,
  LoadRecentActivitiesFailure,
  AddActivity,
  ClearActivities,
  UpdateStats
};
