import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from '@employee-payroll/firebase';
import { DashboardStats, ActivityItem } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private activitiesCollection = 'activities';
  private statsCollection = 'dashboardStats';

  constructor(private firebaseService: FirebaseService) {}

  // Get dashboard statistics from Firestore
  getDashboardStatsData(): Observable<DashboardStats> {
    // First get employees collection to get actual employee count
    return from(getDocs(
      query(
        collection(this.firebaseService.database, 'employees'),
        orderBy('createdAt', 'desc')
      )
    )).pipe(
      switchMap(employeesSnapshot => {
        // Calculate actual employee count from employees collection
        const actualEmployeeCount = employeesSnapshot.docs.length;
        
        // Also get payroll records for payroll calculations
        return from(getDocs(
          query(
            collection(this.firebaseService.database, 'payrollRecords'),
            orderBy('createdAt', 'desc')
          )
        )).pipe(
          switchMap(payrollSnapshot => {
            let totalPayroll = 0;
            let thisMonthPayroll = 0;
            let totalDeductions = 0;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            payrollSnapshot.docs.forEach(doc => {
              const data = doc.data();
              const netSalary = data['netSalary'] || 0;
              const deductions = data['deductions'] || 0;
              totalPayroll += netSalary;
              totalDeductions += deductions;
              
              // Calculate this month payroll
              const createdAt = data['createdAt'];
              if (createdAt) {
                const recordDate = (createdAt as Timestamp).toDate();
                if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                  thisMonthPayroll += netSalary;
                }
              }
            });

            // Now get existing stats or create new ones with actual employee count
            return from(getDoc(doc(this.firebaseService.database, this.statsCollection, 'main'))).pipe(
              map(docSnapshot => {
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
                  return {
                    id: docSnapshot.id,
                    // Use actual employee count, overriding any existing value
                    totalEmployees: actualEmployeeCount,
                    activeEmployees: actualEmployeeCount, // Assume all employees are active
                    totalPayroll: totalPayroll,
                    thisMonthPayroll: thisMonthPayroll,
                    totalDeductions: totalDeductions,
                    // Keep other existing stats if they exist
                    totalPayrollChange: data['totalPayrollChange'] || '+0',
                    totalBonuses: data['totalBonuses'] || 0,
                    totalBonusesChange: data['totalBonusesChange'] || '+0',
                    deductions: data['deductions'] || 0,
                    deductionsChange: data['deductionsChange'] || '+0',
                    attendanceRate: data['attendanceRate'] || 95,
                    pendingTasks: data['pendingTasks'] || 0,
                    // Convert Firestore timestamps to Date objects
                    timestamp: data['timestamp'] ? (data['timestamp'] as Timestamp).toDate() : new Date()
                  } as DashboardStats;
                }
                // Return stats with actual employee count if none exist
                return {
                  id: 'main',
                  totalEmployees: actualEmployeeCount,
                  activeEmployees: actualEmployeeCount,
                  totalPayroll: totalPayroll,
                  thisMonthPayroll: thisMonthPayroll,
                  totalDeductions: totalDeductions,
                  attendanceRate: 95,
                  pendingTasks: 0,
                  timestamp: new Date()
                } as DashboardStats;
              }),
              catchError(error => {
                console.error('Error fetching dashboard stats:', error);
                return of({
                  id: 'main',
                  totalEmployees: actualEmployeeCount,
                  activeEmployees: actualEmployeeCount,
                  totalPayroll: totalPayroll,
                  thisMonthPayroll: thisMonthPayroll,
                  totalDeductions: totalDeductions,
                  attendanceRate: 95,
                  pendingTasks: 0,
                  timestamp: new Date()
                } as DashboardStats);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching employees for stats:', error);
        return of({
          id: 'main',
          totalEmployees: 0,
          activeEmployees: 0,
          totalPayroll: 0,
          thisMonthPayroll: 0,
          totalDeductions: 0,
          attendanceRate: 0,
          pendingTasks: 0,
          timestamp: new Date()
        } as DashboardStats);
      })
    );
  }

  // Get recent activities from Firestore
  getActivitiesData(): Observable<ActivityItem[]> {
    return from(getDocs(
      query(
        collection(this.firebaseService.database, this.activitiesCollection),
        orderBy('timestamp', 'desc'),
        limit(10)
      )
    )).pipe(
      map(querySnapshot => querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<ActivityItem, 'id'>;
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date
          timestamp: data['timestamp'] ? (data['timestamp'] as any).toDate?.() || new Date(data['timestamp']) : new Date()
        } as ActivityItem;
      })),
      catchError(error => {
        console.error('Error fetching activities:', error);
        return of([]);
      })
    );
  }

  // Add new activity to Firestore
  addActivityData(activity: Omit<ActivityItem, 'id' | 'timestamp'>): Observable<ActivityItem> {
    const activityWithTimestamp = {
      ...activity,
      timestamp: new Date()
    };

    return from(addDoc(collection(this.firebaseService.database, this.activitiesCollection), activityWithTimestamp)).pipe(
      map(docRef => ({
        id: docRef.id,
        ...activityWithTimestamp
      })),
      catchError(error => {
        console.error('Error adding activity:', error);
        throw error;
      })
    );
  }

  // Update dashboard stats in Firestore
  updateStatsData(stats: Partial<DashboardStats>): Observable<void> {
    return from(updateDoc(doc(this.firebaseService.database, this.statsCollection, 'main'), {
      ...stats,
      updatedAt: new Date()
    })).pipe(
      catchError(error => {
        console.error('Error updating stats:', error);
        throw error;
      })
    );
  }

  // Delete activity from Firestore
  deleteActivityData(activityId: string): Observable<void> {
    return from(deleteDoc(doc(this.firebaseService.database, this.activitiesCollection, activityId))).pipe(
      catchError(error => {
        console.error('Error deleting activity:', error);
        throw error;
      })
    );
  }

  // Clear all activities from Firestore
  clearActivitiesData(): Observable<void> {
    return from(getDocs(collection(this.firebaseService.database, this.activitiesCollection))).pipe(
      switchMap(querySnapshot => {
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        return from(Promise.all(deletePromises));
      }),
      map(() => undefined), 
      catchError(error => {
        console.error('Error clearing activities:', error);
        throw error;
      })
    );
  }
}
