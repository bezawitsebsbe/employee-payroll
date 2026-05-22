import { Injectable } from '@angular/core';
import { State, StateContext, Action, Selector } from '@ngxs/store';
import { AuthStateModel, User, LoginCredentials, SignupCredentials } from '../../models/auth.model';
import { 
  Login, 
  LoginSuccess, 
  LoginFailure, 
  Logout, 
  LogoutSuccess, 
  LoadCurrentUser, 
  LoadCurrentUserSuccess, 
  LoadCurrentUserFailure, 
  ClearError, 
  SetToken,
  Signup
} from '../action/auth.action';
import { AuthApiService } from '../../api/auth.service';
import { of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    token: null
  }
})
@Injectable() // ✅ ADD THIS (CRITICAL in standalone sometimes)
export class AuthState {
  constructor(private authService: AuthApiService) {}

  @Selector()
  static currentUser(state: AuthStateModel): User | null {
    return state.currentUser;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel): boolean {
    return state.isAuthenticated;
  }

  @Selector()
  static loading(state: AuthStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: AuthStateModel): string | null {
    return state.error;
  }

  @Selector()
  static token(state: AuthStateModel): string | null {
    return state.token;
  }

  @Selector()
  static userRole(state: AuthStateModel): string | null {
    return state.currentUser?.role || null;
  }

  @Selector()
  static isAdmin(state: AuthStateModel): boolean {
    return state.currentUser?.role === 'admin';
  }

  @Selector()
  static isManager(state: AuthStateModel): boolean {
    return state.currentUser?.role === 'admin' || state.currentUser?.role === 'manager';
  }

  // Login Actions
  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, { payload }: Login) {
    ctx.patchState({ loading: true, error: null });

    return this.authService.getUserByEmail(payload!.email).pipe(
      switchMap(user => {
        if (!user || !this.authService.validatePassword(user, payload!.password)) {
          throw new Error('Invalid credentials');
        }

        const mappedUser: User = {
          id: 'temp-id', // Generate temp ID since FirestoreUserData doesn't have id
          name: user.name!,
          email: user.email!,
          role: user.role as any,
          isActive: user.isActive!,
          createdAt: user.createdAt?.toDate?.() || new Date(),
          lastLogin: user.lastLogin?.toDate?.()
        };

        const token = this.authService.generateToken(mappedUser);
        this.authService.saveToken(token);

        return ctx.dispatch(new LoginSuccess({ 
          user: mappedUser, 
          token,
          message: 'Login successful'
        }));
      }),
      catchError(err => ctx.dispatch(new LoginFailure({ error: err.message })))
    );
  }

  @Action(LoginSuccess)
  loginSuccess(ctx: StateContext<AuthStateModel>, action: LoginSuccess) {
    const response = action.payload;
    if (!response) return;
    
    ctx.patchState({
      currentUser: response.user,
      isAuthenticated: true,
      loading: false,
      error: null,
      token: response.token
    });
  }

  @Action(LoginFailure)
  loginFailure(ctx: StateContext<AuthStateModel>, action: LoginFailure) {
    const error = action.payload?.error || 'Unknown error';
    ctx.patchState({
      loading: false,
      error: error
    });
  }

  // Logout Actions
  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ loading: true, error: null });
    this.authService.clearToken();
    return ctx.dispatch(new LogoutSuccess());
  }

  @Action(LogoutSuccess)
  logoutSuccess(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      token: null
    });
  }

  // Signup Actions
  @Action(Signup)
  signup(ctx: StateContext<AuthStateModel>, { payload }: Signup) {
    ctx.patchState({ loading: true, error: null });

    return this.authService.createUser(payload!).pipe(
      switchMap(user => {
        const token = this.authService.generateToken(user);
        this.authService.saveToken(token);
        return ctx.dispatch(new LoginSuccess({ 
          user, 
          token,
          message: 'Signup successful'
        }));
      }),
      catchError(err => ctx.dispatch(new LoginFailure({ error: err.message })))
    );
  }

  // Load Current User
  @Action(LoadCurrentUser)
  loadCurrentUser(ctx: StateContext<AuthStateModel>) {
    const token = this.authService.getToken();
    
    if (!token) {
      return ctx.dispatch(new LoadCurrentUserFailure({ error: 'No token found' }));
    }

    ctx.patchState({ loading: true, error: null });

    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) {
        this.authService.clearToken();
        return ctx.dispatch(new LoadCurrentUserFailure({ error: 'Token expired' }));
      }

      return this.authService.getUserById(payload.userId).pipe(
        map(user => {
          if (user) {
            return ctx.dispatch(new LoadCurrentUserSuccess({ user }));
          } else {
            this.authService.clearToken();
            return ctx.dispatch(new LoadCurrentUserFailure({ error: 'User not found' }));
          }
        }),
        catchError(err => ctx.dispatch(new LoadCurrentUserFailure({ error: err.message })))
      );
    } catch {
      this.authService.clearToken();
      return ctx.dispatch(new LoadCurrentUserFailure({ error: 'Invalid token' }));
    }
  }

  @Action(LoadCurrentUserSuccess)
  loadCurrentUserSuccess(ctx: StateContext<AuthStateModel>, action: LoadCurrentUserSuccess) {
    const payload = action.payload;
    if (!payload) return;
    
    const user = payload.user;
    ctx.patchState({
      currentUser: user,
      isAuthenticated: true,
      loading: false,
      error: null
    });
  }

  @Action(LoadCurrentUserFailure)
  loadCurrentUserFailure(ctx: StateContext<AuthStateModel>, action: LoadCurrentUserFailure) {
    const error = action.payload?.error || 'Unknown error';
    ctx.patchState({
      loading: false,
      error: error
    });
  }

  // Clear Error
  @Action(ClearError)
  clearError(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ error: null });
  }

  // Set Token
  @Action(SetToken)
  setToken(ctx: StateContext<AuthStateModel>, action: SetToken) {
    const token = action.payload?.token;
    ctx.patchState({ token });
  }
}
