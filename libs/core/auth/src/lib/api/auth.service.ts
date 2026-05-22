import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { FirebaseService } from '@employee-payroll/firebase';
import { User, LoginCredentials, SignupCredentials } from '../models/auth.model';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Interface for Firestore user data (includes password for authentication)
interface FirestoreUserData {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  avatar?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  password?: string; // Only for authentication, not returned to client
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private usersCollection = 'users';

  constructor(private firebaseService: FirebaseService) {}

  getUserByEmail(email: string): Observable<FirestoreUserData | null> {
    return from(
      getDocs(
        query(
          collection(this.firebaseService.database, this.usersCollection),
          where('email', '==', email)
        )
      )
    ).pipe(
      map(snapshot => snapshot.empty ? null : snapshot.docs[0].data() as FirestoreUserData),
      catchError(() => of(null))
    );
  }

  getUserById(userId: string): Observable<User | null> {
    return from(
      getDoc(doc(this.firebaseService.database, this.usersCollection, userId))
    ).pipe(
      map(docSnap => {
        if (!docSnap.exists()) return null;
        const data = docSnap.data() as FirestoreUserData;

        return {
          id: docSnap.id,
          name: data.name || '',
          email: data.email || '',
          role: (data.role || 'user') as 'user' | 'admin' | 'manager',
          isActive: data.isActive ?? true,
          avatar: data.avatar,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.()
        };
      }),
      catchError(() => of(null))
    );
  }

  createUser(credentials: SignupCredentials): Observable<User> {
    const firestoreUser: FirestoreUserData = {
      name: credentials.name,
      email: credentials.email,
      role: 'user',
      isActive: true,
      createdAt: Timestamp.now(),
      password: credentials.password
    };

    return from(
      addDoc(collection(this.firebaseService.database, this.usersCollection), firestoreUser)
    ).pipe(
      map(docRef => ({
        id: docRef.id,
        name: credentials.name,
        email: credentials.email,
        role: 'user',
        isActive: true,
        createdAt: new Date()
      }))
    );
  }

  validatePassword(user: FirestoreUserData, password: string): boolean {
    return user.password === password;
  }

  generateToken(user: User): string {
    return btoa(JSON.stringify({
      userId: user.id,
      exp: Date.now() + 86400000
    }));
  }

  saveToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
