import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthState } from '../store/state/auth.state';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private store: Store,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.checkAuth();
  }

  canActivateChild(): Observable<boolean> {
    return this.checkAuth(); // 👈 reuse same logic
  }

  private checkAuth(): Observable<boolean> {
    return this.store.select(AuthState.isAuthenticated).pipe(
      take(1),
      map((isAuth) => {
        if (!isAuth) {
          this.router.navigate(['/auth/signin']);
          return false;
        }
        return true;
      }),
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.store.select(AuthState.isAuthenticated).pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          // User is already authenticated, redirect to dashboard
          this.router.navigate(['/dashboard']);
          return false;
        } else {
          return true;
        }
      }),
    );
  }
}
