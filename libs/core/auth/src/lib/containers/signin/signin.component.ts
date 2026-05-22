import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthFacade } from '../../facades/auth.facade.service';
import { LoginCredentials } from '../../models/auth.model';


@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzSpinModule,
    NzAlertModule
  ],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  loginForm!: FormGroup;
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  showPassword = false;
  loading$: Observable<boolean>;
  error$: Observable<boolean>;
  errorMessage$: Observable<string | null>;

  constructor(
    private authFacade: AuthFacade,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loading$ = this.authFacade.loading$;
    this.error$ = this.authFacade.error$.pipe(
      map(error => !!error)
    );
    this.errorMessage$ = this.authFacade.error$;
  }

  ngOnInit(): void {
    console.log('Signin component initialized');
    // Clear any existing errors
    this.authFacade.clearError();
    
    // Initialize form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    const formValues = this.loginForm.value;
    console.log('Login form submitted:', formValues);
    
    this.authFacade.login(formValues).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('Login failed:', error);
        // Error is handled by the facade and stored in state
      }
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }

  onEmailChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }

  onPasswordChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }
}
