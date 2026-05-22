import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { 
  Login, 
  Logout, 
  LoadCurrentUser, 
  ClearError,
  Signup
} from '../store/action/auth.action';
import { AuthState } from '../store/state/auth.state';
import { User, LoginCredentials, SignupCredentials } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  user$: Observable<User | null>;
  isAuth$: Observable<boolean>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    this.user$ = this.store.select(AuthState.currentUser);
    this.isAuth$ = this.store.select(AuthState.isAuthenticated);
    this.loading$ = this.store.select(AuthState.loading);
    this.error$ = this.store.select(AuthState.error);
  }

  login(credentials: LoginCredentials) {
    return this.store.dispatch(new Login(credentials));
  }

  logout() {
    return this.store.dispatch(new Logout());
  }

  signup(credentials: SignupCredentials) {
    return this.store.dispatch(new Signup(credentials));
  }

  loadUser() {
    return this.store.dispatch(new LoadCurrentUser());
  }

  clearError() {
    return this.store.dispatch(new ClearError());
  }

  // Get current user value synchronously
  get currentUserValue(): User | null {
    return this.store.selectSnapshot(AuthState.currentUser);
  }

  // Get authentication status synchronously
  get isAuthenticatedValue(): boolean {
    return this.store.selectSnapshot(AuthState.isAuthenticated);
  }

  // Get user role synchronously
  get userRoleValue(): string | null {
    return this.store.selectSnapshot(AuthState.userRole);
  }

  // Check if user is admin synchronously
  get isAdminValue(): boolean {
    return this.store.selectSnapshot(AuthState.isAdmin);
  }

  // Check if user is manager synchronously
  get isManagerValue(): boolean {
    return this.store.selectSnapshot(AuthState.isManager);
  }

  // Convenience methods for common checks
  isLoggedIn(): boolean {
    return this.isAuthenticatedValue;
  }

  canAccessAdminFeatures(): boolean {
    return this.isAdminValue;
  }

  canAccessManagerFeatures(): boolean {
    return this.isManagerValue;
  }

  // Get user display name
  getUserDisplayName(): string {
    const user = this.currentUserValue;
    return user ? user.name : 'Guest';
  }

  // Get user email
  getUserEmail(): string {
    const user = this.currentUserValue;
    return user ? user.email : '';
  }

  // Get user avatar or initials
  getUserAvatar(): string {
    const user = this.currentUserValue;
    if (!user) return '';
    
    if (user.avatar) {
      return user.avatar;
    }
    
    // Generate initials from name
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
