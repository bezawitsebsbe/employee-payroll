import { State, StateContext, Action, Selector } from '@ngxs/store';
import { DashboardStats, ActivityItem } from '../../models/dashboard.model';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import {
  LoadDashboardStats,
  LoadDashboardStatsSuccess,
  LoadDashboardStatsFailure,
  LoadRecentActivities,
  LoadRecentActivitiesSuccess,
  LoadRecentActivitiesFailure,
  AddActivity,
  ClearActivities,
  UpdateStats
} from '../action/dashboard.action';


export interface DashboardStateModel {
  stats: DashboardStats | null;
  recentActivities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

@State<DashboardStateModel>({
  name: 'dashboard',
  defaults: {
    stats: null,
    recentActivities: [],
    loading: false,
    error: null
  }
})
export class DashboardState {

  @Selector()
  static stats(state: DashboardStateModel): DashboardStats | null {
    return state.stats;
  }

  @Selector()
  static recentActivities(state: DashboardStateModel): ActivityItem[] {
    return state.recentActivities;
  }

  @Selector()
  static loading(state: DashboardStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: DashboardStateModel): string | null {
    return state.error;
  }

  @Action(LoadDashboardStats)
  loadDashboardStats({ patchState, dispatch }: StateContext<DashboardStateModel>): Observable<any> {
    patchState({ loading: true, error: null });
    
    console.log(' Loading dashboard stats...');
    
    //  Use mock data for now - API calls should be in facade
    return of({}).pipe(
      tap(() => {
        const mockStats: DashboardStats = {
          id: 'main',
          totalEmployees: 0, // Will be updated by facade
          activeEmployees: 0,
          totalPayroll: 0,
          thisMonthPayroll: 0,
          totalDeductions: 0,
          attendanceRate: 0,
          pendingTasks: 0,
          timestamp: new Date()
        };
        dispatch(new LoadDashboardStatsSuccess({ stats: mockStats }));
      }),
      catchError((error) => {
        console.error(' Failed to load dashboard stats:', error);
        dispatch(new LoadDashboardStatsFailure({ error: error.message || 'Failed to load dashboard stats' }));
        return of();
      })
    );
  }

  @Action(LoadDashboardStatsSuccess)
  loadDashboardStatsSuccess({ patchState }: StateContext<DashboardStateModel>, action: LoadDashboardStatsSuccess) {
    patchState({
      stats: action.payload?.stats,
      loading: false,
      error: null
    });
  }

  @Action(LoadDashboardStatsFailure)
  loadDashboardStatsFailure({ patchState }: StateContext<DashboardStateModel>, action: LoadDashboardStatsFailure) {
    patchState({
      loading: false,
      error: action.payload?.error
    });
  }

  @Action(LoadRecentActivities)
  loadRecentActivities({ patchState, dispatch }: StateContext<DashboardStateModel>): Observable<any> {
    patchState({ loading: true, error: null });
    
    console.log(' Loading recent activities...');
    
    //  Use mock data for now - API calls should be in facade
    return of({}).pipe(
      tap(() => {
        const mockActivities: ActivityItem[] = [];
        dispatch(new LoadRecentActivitiesSuccess({ activities: mockActivities }));
      }),
      catchError((error) => {
        console.error(' Failed to load recent activities:', error);
        dispatch(new LoadRecentActivitiesFailure({ error: error.message || 'Failed to load recent activities' }));
        return of([]);
      })
    );
  }

  @Action(LoadRecentActivitiesSuccess)
  loadRecentActivitiesSuccess({ patchState }: StateContext<DashboardStateModel>, action: LoadRecentActivitiesSuccess) {
    patchState({
      recentActivities: action.payload?.activities || [],
      loading: false,
      error: null
    });
  }

  @Action(LoadRecentActivitiesFailure)
  loadRecentActivitiesFailure({ patchState }: StateContext<DashboardStateModel>, action: LoadRecentActivitiesFailure) {
    patchState({
      loading: false,
      error: action.payload?.error
    });
  }

  @Action(AddActivity)
  addActivity(
    { patchState, getState }: StateContext<DashboardStateModel>,
    action: AddActivity
  ) {
    if (!action.payload?.activity) return of();

    console.log(' Adding new activity:', action.payload.activity);
    
    //  Simple state update - API calls should be in facade
    const currentActivities = getState().recentActivities;
    const newActivity = action.payload.activity;
    const updatedActivities = [newActivity, ...currentActivities].slice(0, 10); // Keep last 10
  
    patchState({
      recentActivities: updatedActivities
    });
  
    return of();
  }

  @Action(ClearActivities)
  clearActivities({ patchState }: StateContext<DashboardStateModel>) {
    patchState({
      recentActivities: []
    });
  }

  @Action(UpdateStats)
  updateStats({ patchState, getState }: StateContext<DashboardStateModel>, action: UpdateStats) {
    const currentStats = getState().stats;
    const newStats = action.payload?.stats;
    if (currentStats && newStats) {
      patchState({
        stats: { ...currentStats, ...newStats }
      });
    }
  }
}
