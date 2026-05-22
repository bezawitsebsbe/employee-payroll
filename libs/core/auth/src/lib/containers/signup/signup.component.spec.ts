import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SignupComponent } from './signup.component';
import { AuthFacade } from '../../facades/auth.facade.service';
import { SignupCredentials } from '../../models/auth.model';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let mockAuthFacade: any;
  let mockRouter: any;

  beforeEach(async () => {
    const authFacadeSpy = jasmine.createSpyObj('AuthFacade', [
      'signup',
      'error$',
      'clearError'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SignupComponent],
      providers: [
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    mockAuthFacade = TestBed.inject(AuthFacade);
    mockRouter = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    mockAuthFacade.error$ = of(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty fields', () => {
    expect(component.signupForm.get('firstName')?.value).toBe('');
    expect(component.signupForm.get('lastName')?.value).toBe('');
    expect(component.signupForm.get('email')?.value).toBe('');
    expect(component.signupForm.get('password')?.value).toBe('');
    expect(component.signupForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.signupForm;
    
    // Initially form should be invalid
    expect(form.invalid).toBeTruthy();

    // Test firstName validation
    form.get('firstName')?.setValue('');
    expect(form.get('firstName')?.invalid).toBeTruthy();

    form.get('firstName')?.setValue('John');
    expect(form.get('firstName')?.valid).toBeTruthy();

    // Test lastName validation
    form.get('lastName')?.setValue('');
    expect(form.get('lastName')?.invalid).toBeTruthy();

    form.get('lastName')?.setValue('Doe');
    expect(form.get('lastName')?.valid).toBeTruthy();

    // Test email validation
    form.get('email')?.setValue('invalid-email');
    expect(form.get('email')?.invalid).toBeTruthy();

    form.get('email')?.setValue('john.doe@example.com');
    expect(form.get('email')?.valid).toBeTruthy();

    // Test password validation
    form.get('password')?.setValue('123');
    expect(form.get('password')?.invalid).toBeTruthy();

    form.get('password')?.setValue('password123');
    expect(form.get('password')?.valid).toBeTruthy();
  });

  it('should validate password confirmation', () => {
    const form = component.signupForm;
    
    form.get('password')?.setValue('password123');
    form.get('confirmPassword')?.setValue('different');
    
    expect(form.hasError('passwordMismatch')).toBeTruthy();
    expect(form.invalid).toBeTruthy();

    form.get('confirmPassword')?.setValue('password123');
    
    expect(form.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should submit form successfully', () => {
    mockAuthFacade.signup.and.returnValue(of(undefined));

    component.signupForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(mockAuthFacade.signup).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isLoading).toBeFalsy();
  });

  it('should handle signup error', () => {
    mockAuthFacade.signup.and.returnValue(throwError(() => new Error('Signup failed')));

    component.signupForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(mockAuthFacade.signup).toHaveBeenCalled();
    expect(component.isLoading).toBeFalsy();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not submit invalid form', () => {
    component.signupForm.setValue({
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      password: '123',
      confirmPassword: 'different'
    });

    component.onSubmit();

    expect(mockAuthFacade.signup).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();

    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTruthy();

    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalsy();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword).toBeFalsy();

    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeTruthy();

    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeFalsy();
  });

  it('should navigate to signin', () => {
    component.navigateToSignin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/signin']);
  });

  it('should clear error on input changes', () => {
    component.onNameChange();
    expect(mockAuthFacade.clearError).toHaveBeenCalled();

    component.onEmailChange();
    expect(mockAuthFacade.clearError).toHaveBeenCalled();

    component.onPasswordChange();
    expect(mockAuthFacade.clearError).toHaveBeenCalled();

    component.onConfirmPasswordChange();
    expect(mockAuthFacade.clearError).toHaveBeenCalled();
  });

  it('should validate form correctly', () => {
    // Invalid form
    component.credentials = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    expect(component.isFormValid()).toBeFalsy();

    // Valid form
    component.credentials = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };
    expect(component.isFormValid()).toBeTruthy();

    // Password mismatch
    component.credentials = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different'
    };
    expect(component.isFormValid()).toBeFalsy();

    // Password too short
    component.credentials = {
      name: 'John Doe',
      email: 'john@example.com',
      password: '123',
      confirmPassword: '123'
    };
    expect(component.isFormValid()).toBeFalsy();
  });

  it('should assess password strength', () => {
    // Weak password
    component.credentials.password = '123';
    expect(component.getPasswordStrength()).toBe('weak');
    expect(component.getPasswordStrengthColor()).toBe('#ff4d4f');
    expect(component.getPasswordStrengthText()).toBe('Weak password');

    // Medium password
    component.credentials.password = 'password123';
    expect(component.getPasswordStrength()).toBe('medium');
    expect(component.getPasswordStrengthColor()).toBe('#faad14');
    expect(component.getPasswordStrengthText()).toBe('Medium strength');

    // Strong password
    component.credentials.password = 'Password123!';
    expect(component.getPasswordStrength()).toBe('strong');
    expect(component.getPasswordStrengthColor()).toBe('#52c41a');
    expect(component.getPasswordStrengthText()).toBe('Strong password');

    // Empty password
    component.credentials.password = '';
    expect(component.getPasswordStrength()).toBe('weak');
    expect(component.getPasswordStrengthText()).toBe('');
  });

  it('should clear error on init', () => {
    fixture.detectChanges();
    expect(mockAuthFacade.clearError).toHaveBeenCalled();
  });
});
