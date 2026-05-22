import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { FirebaseService } from '@employee-payroll/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';

export interface Employee {
  id?: string;
  empId: string;
  fullName: string;
  position: string;
  baseSalary: number;
  department?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  status?: string;
}

export interface PayrollRecord {
  id?: string;
  employeeName: string;
  employeeId: string;
  department: string;
  baseSalary: number;
  weeklyBonus: number;
  monthlyBonus: number;
  jobDoneBonus: number;
  deductions: number;
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayrollFormData {
  employeeName: string;
  employeeId: string;
  department: string;
  baseSalary: string;
  weeklyBonus: string;
  monthlyBonus: string;
  jobDoneBonus: string;
  deductions: string;
  netSalary: string;
  status: string;
}

// Interface for Firebase employee data (from employee app)
interface FirebaseEmployee {
  id: string;
  [key: string]: any; // Allow any additional properties
}

@Injectable({
  providedIn: 'root'
})
export class PayrollFirebaseApi {
  constructor(private firebaseService: FirebaseService) {}

  // 🔥 Get all employees from Firebase (using shared service)
  getEmployees(): Observable<Employee[]> {
    return from(this.firebaseService.getEmployees()).pipe(
      map((employees: FirebaseEmployee[]) => 
        employees.map(emp => ({
          id: emp.id,
          empId: emp['empId'] || '',
          fullName: emp['fullName'] || emp['name'] || '',
          position: emp['position'] || emp['jobTitle'] || '',
          baseSalary: emp['baseSalary'] || emp['salary'] || 0,
          department: emp['department'] || '',
          email: emp['email'] || '',
          phone: emp['phone'] || '',
          hireDate: emp['hireDate'] || '',
          status: emp['status'] || 'active'
        } as Employee))
      ),
      catchError(error => {
        console.error('Error fetching employees:', error);
        return of([]);
      })
    );
  }

  // 🔥 Get employee by ID
  getEmployeeById(empId: string): Observable<Employee | null> {
    const q = query(
      collection(this.firebaseService.database, 'employees'), 
      where('empId', '==', empId),
      limit(1)
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        const doc = snapshot.docs[0];
        return doc ? { id: doc.id, ...doc.data() } as Employee : null;
      }),
      catchError(error => {
        console.error('Error fetching employee by ID:', error);
        return of(null);
      })
    );
  }

  // 🔥 Get all payroll records
  getPayrollRecords(): Observable<PayrollRecord[]> {
    return from(getDocs(
      query(
        collection(this.firebaseService.database, 'payrollRecords'),
        orderBy('createdAt', 'desc')
      )
    )).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PayrollRecord))
      ),
      catchError(error => {
        console.error('Error fetching payroll records:', error);
        return of([]);
      })
    );
  }

  // 🔥 Get payroll record by ID
  getPayrollRecordById(id: string): Observable<PayrollRecord | null> {
    return from(getDoc(doc(this.firebaseService.database, 'payrollRecords', id))).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          return { id: docSnapshot.id, ...docSnapshot.data() } as PayrollRecord;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching payroll record:', error);
        return of(null);
      })
    );
  }

  // 🔥 Create payroll record
  createPayrollRecord(record: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const payrollData = {
      ...record,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(addDoc(collection(this.firebaseService.database, 'payrollRecords'), payrollData)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error creating payroll record:', error);
        throw error;
      })
    );
  }

  // 🔥 Update payroll record
  updatePayrollRecord(id: string, record: Partial<PayrollRecord>): Observable<void> {
    const updateData = {
      ...record,
      updatedAt: new Date()
    };

    return from(updateDoc(doc(this.firebaseService.database, 'payrollRecords', id), updateData)).pipe(
      catchError(error => {
        console.error('Error updating payroll record:', error);
        throw error;
      })
    );
  }

  // 🔥 Delete payroll record
  deletePayrollRecord(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firebaseService.database, 'payrollRecords', id))).pipe(
      catchError(error => {
        console.error('Error deleting payroll record:', error);
        throw error;
      })
    );
  }

  // 🔥 Get payroll statistics
  getPayrollStatistics(): Observable<{
    totalPayroll: number;
    totalEmployees: number;
    totalBonuses: number;
    totalDeductions: number;
    pendingCount: number;
    processedCount: number;
    paidCount: number;
  }> {
    return combineLatest([
      this.getEmployees(),
      this.getPayrollRecords()
    ]).pipe(
      map(([employees, records]: [Employee[], PayrollRecord[]]) => {
        const totalPayroll = records.reduce((sum: number, record: PayrollRecord) => sum + record.netSalary, 0);
        const totalBonuses = records.reduce((sum: number, record: PayrollRecord) => 
          sum + record.weeklyBonus + record.monthlyBonus + record.jobDoneBonus, 0
        );
        const totalDeductions = records.reduce((sum: number, record: PayrollRecord) => sum + record.deductions, 0);
        
        const pendingCount = records.filter((r: PayrollRecord) => r.status === 'Pending').length;
        const processedCount = records.filter((r: PayrollRecord) => r.status === 'Processed').length;
        const paidCount = records.filter((r: PayrollRecord) => r.status === 'Paid').length;

        return {
          totalPayroll,
          totalEmployees: employees.length, // Use actual employee count
          totalBonuses,
          totalDeductions,
          pendingCount,
          processedCount,
          paidCount
        };
      }),
      catchError(error => {
        console.error('Error fetching payroll statistics:', error);
        return of({
          totalPayroll: 0,
          totalEmployees: 0,
          totalBonuses: 0,
          totalDeductions: 0,
          pendingCount: 0,
          processedCount: 0,
          paidCount: 0
        });
      })
    );
  }

  // 🔥 Search employees by name or ID
  searchEmployees(searchTerm: string): Observable<Employee[]> {
    if (!searchTerm.trim()) {
      return this.getEmployees();
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return this.getEmployees().pipe(
      map(employees => 
        employees.filter(emp => 
          emp.fullName.toLowerCase().includes(lowerSearchTerm) ||
          emp.empId.toLowerCase().includes(lowerSearchTerm)
        )
      )
    );
  }

  // 🔥 Filter payroll records by status
  getPayrollRecordsByStatus(status: string): Observable<PayrollRecord[]> {
    if (status === 'all') {
      return this.getPayrollRecords();
    }

    const q = query(
      collection(this.firebaseService.database, 'payrollRecords'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PayrollRecord))
      ),
      catchError(error => {
        console.error('Error fetching payroll records by status:', error);
        return of([]);
      })
    );
  }
}
