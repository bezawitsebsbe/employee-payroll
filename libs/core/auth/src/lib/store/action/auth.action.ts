import { User, LoginCredentials, AuthResponse, SignupCredentials } from '../../models/auth.model';

export class Login {
  static readonly type = '[AuthState] Login';
  constructor(public readonly payload?: LoginCredentials) {}
}

export class LoginSuccess {
  static readonly type = '[AuthState] Login Success';
  constructor(public readonly payload?: AuthResponse) {}
}

export class LoginFailure {
  static readonly type = '[AuthState] Login Failure';
  constructor(public readonly payload?: { error: string }) {}
}

export class Signup {
  static readonly type = '[AuthState] Signup';
  constructor(public readonly payload?: SignupCredentials) {}
}

export class Logout {
  static readonly type = '[AuthState] Logout';
  constructor() {
    // Empty constructor for logout action
  }
}

export class LogoutSuccess {
  static readonly type = '[AuthState] Logout Success';
  constructor() {
    // Empty constructor for logout success action
  }
}

export class LogoutFailure {
  static readonly type = '[AuthState] Logout Failure';
  constructor(public readonly payload?: { error: string }) {}
}

export class LoadCurrentUser {
  static readonly type = '[AuthState] LoadCurrentUser';
  constructor() {
    // Empty constructor for load current user action
  }
}

export class LoadCurrentUserSuccess {
  static readonly type = '[AuthState] LoadCurrentUser Success';
  constructor(public readonly payload?: { user: User }) {}
}

export class LoadCurrentUserFailure {
  static readonly type = '[AuthState] LoadCurrentUser Failure';
  constructor(public readonly payload?: { error: string }) {}
}

export class ClearError {
  static readonly type = '[AuthState] ClearError';
  constructor() {
    // Empty constructor for clear error action
  }
}

export class SetToken {
  static readonly type = '[AuthState] SetToken';
  constructor(public readonly payload?: { token: string }) {}
}
