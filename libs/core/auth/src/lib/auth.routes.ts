import { Routes } from '@angular/router';
import { SigninComponent } from './containers/signin/signin.component';
import { SignupComponent } from './containers/signup/signup.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'signin',
    component: SigninComponent,
    title: 'Sign In'
  },
  {
    path: 'signup',
    component: SignupComponent,
    title: 'Sign Up'
  },
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  }
];