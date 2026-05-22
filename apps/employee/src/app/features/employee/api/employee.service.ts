import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { FirebaseService } from '@employee-payroll/firebase';
import { EmployeeEndpoint } from './employee.endpoint';
import { Employee } from '../models/employee.model';

// Employee API Service - Handles Firebase operations for employees

@Injectable({
  providedIn: 'root'
})
export class EmployeeApiService {
  employeeRootEndpoint;
  private employeeCounter = 1; // Simple counter for sequential IDs
  private counterInitialized = false;
  private isCreating = false; // Flag to prevent duplicate creations

  constructor(
    private readonly firebaseService: FirebaseService
  ) {
    this.employeeRootEndpoint = {
      employees: EmployeeEndpoint.collection
    };
  }

  // Initialize the counter based on existing employee IDs
  private async initializeCounter(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(this.firebaseService.database, this.employeeRootEndpoint.employees));
      const employees = snapshot.docs.map(doc => {
        const data = doc.data();
        return data['empId'] as string;
      }).filter(empId => empId && empId.startsWith('EMP'));

      // Extract numbers from existing empIds
      const numbers = employees
        .map(empId => parseInt(empId.replace('EMP', '')))
        .filter(num => !isNaN(num));

      // Set counter to next available number
      if (numbers.length > 0) {
        const maxNumber = Math.max(...numbers);
        this.employeeCounter = maxNumber + 1;
      } else {
        this.employeeCounter = 1;
      }
    } catch (error) {
      console.error('Error initializing employee counter:', error);
      this.employeeCounter = 1; // Fallback
    }
  }

  // Generate employee ID for new employees
  private async generateEmployeeId(): Promise<string> {
    const prefix = 'EMP';
    
    // Initialize counter on first use
    if (!this.counterInitialized) {
      await this.initializeCounter();
      this.counterInitialized = true;
    }
    
    const currentId = this.employeeCounter++;
    return `${prefix}${currentId.toString().padStart(3, '0')}`;
  }

  getEmployees(): Observable<Employee[]> {
    return from(
      getDocs(collection(this.firebaseService.database, this.employeeRootEndpoint.employees))
    ).pipe(
      map((snapshot: QuerySnapshot) =>
        snapshot.docs.map((doc: any) => {
          const data = doc.data();

          return {
            ...data,
            id: doc.id,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Employee;
        })
      ),
      catchError(error => {
        console.error('Error fetching employees:', error);
        return of([]);
      })
    );
  }

  getEmployee(id: string): Observable<Employee | null> {
    return from(
      getDoc(doc(this.firebaseService.database, this.employeeRootEndpoint.employees, id))
    ).pipe(
      map((docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          return {
            ...data,
            id: docSnapshot.id,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as Employee;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching employee by ID:', error);
        return of(null);
      })
    );
  }

  createEmployee(employee: any): Observable<Employee> {
    return from(this.createEmployeeAsync(employee));
  }

  private async createEmployeeAsync(employee: any): Promise<Employee> {
    // Prevent duplicate creations
    if (this.isCreating) {
      throw new Error('Employee creation already in progress');
    }

    this.isCreating = true;

    try {
      // Generate empId for new employees
      const empId = await this.generateEmployeeId();
      console.log('Generated empId:', empId);
      
      const employeeWithEmpId = {
        ...employee,
        empId: empId
      };

      console.log('Employee data before saving:', employeeWithEmpId);

      const employeeWithTimestamp = {
        ...employeeWithEmpId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(this.firebaseService.database, this.employeeRootEndpoint.employees),
        employeeWithTimestamp
      );

      const result = {
        id: docRef.id, // real ID
        ...employeeWithEmpId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Final employee result:', result);
      return result;
    } finally {
      this.isCreating = false;
    }
  }

  updateEmployee(id: string, changes: Partial<Employee>): Observable<Employee> {
    const changesWithTimestamp = {
      ...changes,
      updatedAt: Timestamp.now()
    };

    return from(
      updateDoc(doc(this.firebaseService.database, this.employeeRootEndpoint.employees, id), changesWithTimestamp)
    ).pipe(
      map(() => ({ 
        id, 
        ...changesWithTimestamp,
        updatedAt: new Date()
      } as Employee)),
      catchError(error => {
        console.error('Error updating employee:', error);
        throw error;
      })
    );
  }

  deleteEmployee(id: string): Observable<void> {
    return from(
      deleteDoc(doc(this.firebaseService.database, this.employeeRootEndpoint.employees, id))
    ).pipe(
      catchError(error => {
        console.error('Error deleting employee:', error);
        throw error;
      })
    );
  }
}
