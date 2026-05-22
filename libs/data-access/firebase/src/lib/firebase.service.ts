import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebase.config';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private db = getFirestore(this.app);
  private auth = getAuth(this.app);

  // Getter to access the database instance
  get database() {
    return this.db;
  }

  // 🔥 Example: Get employees
  async getEmployees() {
    const snapshot = await getDocs(collection(this.db, 'employees'));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // ➕ Add employee
  addEmployee(emp: any) {
    return addDoc(collection(this.db, 'employees'), emp);
  }
}
