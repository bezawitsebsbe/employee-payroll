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
import { AuthFacade } from '../../facades/auth.facade.service';
import { SignupCredentials } from '../../models/auth.model';
import { AuthApiService } from '../../api/auth.service';

@Component({
  selector: 'app-signup',
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
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage$!: Observable<string | null>;
  credentials: SignupCredentials = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private authFacade: AuthFacade,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.errorMessage$ = this.authFacade.error$;
    // Initialize form immediately in constructor
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: (form: FormGroup) => {
        const password = form.get('password')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
        
        if (password !== confirmPassword) {
          return { passwordMismatch: true };
        }
        return null;
      }
    });
  }

  ngOnInit(): void {
    console.log('Signup component initialized');
    // Clear any existing errors
    this.authFacade.clearError();
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    const formValues = this.signupForm.value;
    const credentials = {
      name: `${formValues.firstName} ${formValues.lastName}`,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword
    };
    
    console.log('Signup form submitted:', credentials);
    
    this.authFacade.signup(credentials).subscribe({
      next: (response: any) => {
        console.log('Signup successful:', response);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('Signup failed:', error);
        // Error is handled by the facade and stored in NGXS state
        this.isLoading = false;
      }
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  navigateToSignin(): void {
    this.router.navigate(['/auth/signin']);
  }

  onNameChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }

  onEmailChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }

  onPasswordChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }

  onConfirmPasswordChange(): void {
    // Clear error when user starts typing
    this.authFacade.clearError();
  }

  // Form validation
  isFormValid(): boolean {
    return !!(
      this.credentials.name &&
      this.credentials.email &&
      this.credentials.password &&
      this.credentials.confirmPassword &&
      this.credentials.password === this.credentials.confirmPassword &&
      this.credentials.password.length >= 6
    );
  }

  // Password strength indicator
  getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    if (!this.credentials.password) return 'weak';
    
    const password = this.credentials.password;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
      return 'strong';
    } else if (password.length >= 6 && (hasUpperCase || hasLowerCase) && hasNumbers) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'strong': return '#52c41a';
      case 'medium': return '#faad14';
      case 'weak': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'strong': return 'Strong password';
      case 'medium': return 'Medium strength';
      case 'weak': return 'Weak password';
      default: return '';
    }
  }
}

