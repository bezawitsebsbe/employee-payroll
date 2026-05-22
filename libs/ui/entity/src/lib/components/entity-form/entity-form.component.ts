import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, ValidatorFn, FormControl } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject } from 'rxjs';

import {
  EntityColumn,
  EntityConfig
} from '../../models/entity-model';

export interface EntityFormMode {
  mode: 'create' | 'edit' | 'view';
  title: string;
}

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzIconModule,
    NzModalModule
  ],
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.scss']
})
export class EntityFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() data: Record<string, unknown> = {};
  @Input() fields: EntityColumn[] = [];
  @Input() mode: EntityFormMode = { mode: 'create', title: 'Create Entity' };
  @Input() config: EntityConfig = {};
  @Input() standalone = false; // New property for standalone page usage
  @Input() showActions = true; // Control form actions visibility
  @Input() loading = false;
  @Input() externalLoading = false; // New input for parent-controlled loading
  @Input() readonly = false; // Add readonly input property
  @Input() formKey: string | undefined; // Add formKey input for form instance isolation

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<Record<string, unknown>>();
  @Output() resetLoadingState = new EventEmitter<void>();
  @Output() testEvent = new EventEmitter<void>();

  @ViewChild('formElement') formElement!: ElementRef<HTMLFormElement>;

  entityForm!: FormGroup;
  private isSubmitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    console.log('🔥 EntityForm initialized');
    console.log('🔥 EntityForm mode:', this.mode);
    console.log('🔥 EntityForm standalone:', this.standalone);
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔥 EntityForm ngOnChanges called:', changes);
    
    // If data changes and form is already initialized, patch the new data
    if (changes['data'] && this.entityForm && !changes['data'].firstChange) {
      console.log('🔥 Data changed, patching form with:', changes['data'].currentValue);
      if ((this.mode.mode === 'edit' || this.mode.mode === 'view') && Object.keys(this.data).length > 0) {
        this.patchFormData();
      }
    }
    
    // If readonly changes, update form state
    if (changes['readonly'] && this.entityForm && !changes['readonly'].firstChange) {
      console.log('🔥 Readonly changed to:', changes['readonly'].currentValue);
      if (this.readonly) {
        this.entityForm.disable();
      } else {
        this.entityForm.enable();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    console.log(' EntityForm initializeForm called');
    console.log(' EntityForm fields:', this.fields);
    console.log(' EntityForm data:', this.data);
    
    const formGroup: Record<string, FormControl> = {};

    this.fields.forEach(field => {
      const validators = this.getValidators(field);
      const defaultValue = this.getDefaultValue(field);

      if (field.type === 'select' && field.options) {
        formGroup[field.key] = this.fb.control(defaultValue, validators);
      } else if (field.type === 'boolean') {
        formGroup[field.key] = this.fb.control(defaultValue, validators);
      } else if (field.type === 'date') {
        formGroup[field.key] = this.fb.control(defaultValue, validators);
      } else {
        formGroup[field.key] = this.fb.control(defaultValue, validators);
      }
    });

    this.entityForm = this.fb.group(formGroup);

    // Patch form with existing data for edit or view mode
    if ((this.mode.mode === 'edit' || this.mode.mode === 'view') && Object.keys(this.data).length > 0) {
      this.patchFormData();
    }

    // Control form disabled state based on readonly property
    if (this.readonly) {
      this.entityForm.disable();
    } else {
      this.entityForm.enable();
    }
  }

  private getValidators(field: EntityColumn): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Required field validation
    if (field.required) {
      validators.push(RxwebValidators.required());
    }

    // Email validation
    if (field.type === 'email' || field.key.toLowerCase().includes('email')) {
      validators.push(RxwebValidators.email());
    }

    // Numeric field validation
    if (field.type === 'number') {
      // Basic numeric validation using pattern
      validators.push(RxwebValidators.pattern({ expression: { 'number': /^\d+(\.\d+)?$/ } }));
    }

    // Text field validation
    if (field.type === 'text') {
      if (field.minLength !== undefined) {
        validators.push(RxwebValidators.minLength({ value: field.minLength }));
      }
      if (field.maxLength !== undefined) {
        validators.push(RxwebValidators.maxLength({ value: field.maxLength }));
      }
      
      // Phone number validation
      if (field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('mobile')) {
        validators.push(RxwebValidators.pattern({ expression: { 'phone': /^[+]?[\d\s-()]+$/ } }));
      }
      
      // Name validation (letters and spaces)
      if (field.key.toLowerCase().includes('name') && !field.key.toLowerCase().includes('username')) {
        validators.push(RxwebValidators.pattern({ expression: { 'name': /^[a-zA-Z\s]+$/ } }));
      }
      
      // Username validation (alphanumeric with underscore/hyphen)
      if (field.key.toLowerCase().includes('username')) {
        validators.push(RxwebValidators.pattern({ expression: { 'username': /^[a-zA-Z0-9_-]+$/ } }));
      }
    }

    // Date validation
    if (field.type === 'date') {
      validators.push(RxwebValidators.date());
    }

    // Select field validation
    if (field.type === 'select' && field.required) {
      validators.push(RxwebValidators.notEmpty());
    }

    return validators;
  }

  private getDefaultValue(field: EntityColumn): unknown {
    if ((this.mode.mode === 'edit' || this.mode.mode === 'view') && this.data[field.key] !== undefined) {
      const value = this.data[field.key];
      
      // Convert dates to Date objects for NG-Zorro date picker
      if (field.type === 'date') {
        // Handle Firestore Timestamp objects
        if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
          const timestamp = value as { seconds: number; nanoseconds: number };
          const dateObj = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
          return dateObj;
        }
        
        // Handle string dates
        if (typeof value === 'string') {
          // Handle DD/MM/YYYY format
          if (value.includes('/')) {
            const [day, month, year] = value.split('/');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return dateObj;
          }
          // Handle ISO date strings or other formats
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              return dateObj;
            }
          } catch {
            console.warn('Invalid date format:', value);
          }
        }
        
        // Handle Date objects directly
        if (value instanceof Date) {
          return value;
        }
        
        return null;
      }
      
      return value;
    }

    switch (field.type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'date':
        return null;
      case 'select':
        return field.options && field.options.length > 0 ? field.options[0] : null;
      default:
        return '';
    }
  }

  private patchFormData(): void {
    console.log('🔥 patchFormData called with data:', this.data);
    const patchData: Record<string, unknown> = {};

    this.fields.forEach(field => {
      if (this.data[field.key] !== undefined) {
        const value = this.data[field.key];
        
        // Convert dates to Date objects for NG-Zorro date picker
        if (field.type === 'date') {
          // Handle Firestore Timestamp objects
          if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
            const timestamp = value as { seconds: number; nanoseconds: number };
            const dateObj = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
            patchData[field.key] = dateObj;
          }
          // Handle string dates
          else if (typeof value === 'string') {
            // Handle DD/MM/YYYY format
            if (value.includes('/')) {
              const [day, month, year] = value.split('/');
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              patchData[field.key] = dateObj;
            } else {
              // Handle ISO date strings or other formats
              try {
                const dateObj = new Date(value);
                if (!isNaN(dateObj.getTime())) {
                  patchData[field.key] = dateObj;
                } else {
                  patchData[field.key] = null;
                }
              } catch {
                patchData[field.key] = null;
              }
            }
          }
          // Handle Date objects directly
          else if (value instanceof Date) {
            patchData[field.key] = value;
          }
          else {
            patchData[field.key] = null;
          }
        } else {
          patchData[field.key] = value;
        }
      }
    });

    console.log('🔥 Patching form with data:', patchData);
    this.entityForm.patchValue(patchData);
    console.log('🔥 Form patched successfully');
  }

  onSubmit(): void {
    console.log('🔥 EntityForm onSubmit called');
    console.log('🔥 isSubmitting:', this.isSubmitting);
    console.log('🔥 entityForm.valid:', this.entityForm.valid);
    console.log('🔥 entityForm.value:', this.entityForm.value);
    
    if (this.isSubmitting || this.entityForm.invalid) {
      if (this.entityForm.invalid) {
        console.log('❌ Form invalid, marking as touched');
        this.markFormAsTouched();
        this.message.error('Please fill in all required fields correctly.');
      }
      return;
    }

    console.log('✅ Form submission starting...');
    this.isSubmitting = true;
    this.loading = true;
    const formData = this.entityForm.value;

    console.log('🔥 Emitting submit event with formData:', formData);
    this.submit.emit(formData);
    
    // Show success message for standalone mode
    if (this.standalone && this.mode.mode === 'edit') {
      this.message.success('Employee updated successfully!');
    } else if (this.standalone && this.mode.mode === 'create') {
      this.message.success('Employee created successfully!');
    }
    
    // Don't auto-reset loading if external loading is controlled
    if (!this.externalLoading) {
      // Reset submission flag after a delay
      setTimeout(() => {
        this.isSubmitting = false;
        this.loading = false;
      }, 1000);
    }
  }

  onCancel(): void {
    console.log('🔥 EntityForm onCancel called');
    console.log('🔥 standalone:', this.standalone);
    console.log('🔥 Emitting cancel event');
    
    // Test event binding
    this.testEvent.emit();
    console.log('🔥 Test event emitted');
    
    if (this.standalone) {
      this.cancel.emit();
      console.log('✅ Cancel event emitted for standalone mode');
    } else {
      this.visibleChange.emit(false);
      console.log('✅ Modal close event emitted');
    }
  }

  onDelete(): void {
    console.log('🔥 EntityForm onDelete called');
    
    // Emit delete event with current form data
    this.delete.emit(this.entityForm.value);
    console.log('✅ Delete event emitted');
  }

  private markFormAsTouched(): void {
    Object.keys(this.entityForm.controls).forEach(key => {
      this.entityForm.get(key)?.markAsTouched();
    });
  }

  // Form field helpers
  getFieldType(field: EntityColumn): string {
    return field.type || 'text';
  }

  getFieldPlaceholder(field: EntityColumn): string {
    return field.placeholder || `Enter ${field.name}`;
  }

  getFieldOptions(field: EntityColumn): Array<{label: string; value: string}> {
    return (field.options || []).map(option => ({
      label: option,
      value: option
    }));
  }

  isFieldRequired(field: EntityColumn): boolean {
    return field.required || false;
  }

  trackByField(index: number, field: EntityColumn): string {
    return field.key;
  }

  // Form validation helpers
  hasError(field: EntityColumn, errorType: string): boolean {
    const formControl = this.entityForm.get(field.key);
    return formControl?.hasError(errorType) && formControl?.touched || false;
  }

  getErrorMessage(field: EntityColumn): string {
    const formControl = this.entityForm.get(field.key);

    if (!formControl || !formControl.errors || !formControl.touched) {
      return '';
    }

    const errors = formControl.errors;

    // RxWebValidators error messages
    if (errors['required']) {
      return `${field.name} is required`;
    }

    if (errors['email']) {
      return `${field.name} must be a valid email address`;
    }

    if (errors['minLength']) {
      return `${field.name} must be at least ${errors['minLength'].value} characters long`;
    }

    if (errors['maxLength']) {
      return `${field.name} must not exceed ${errors['maxLength'].value} characters`;
    }

    if (errors['pattern']) {
      const patternName = Object.keys(errors['pattern'])[0];
      switch (patternName) {
        case 'phone':
          return `${field.name} must be a valid phone number`;
        case 'username':
          return `${field.name} can only contain letters, numbers, underscores, and hyphens`;
        case 'name':
          return `${field.name} can only contain letters and spaces`;
        case 'number':
          return `${field.name} must be a valid number`;
        default:
          return `${field.name} format is invalid`;
      }
    }

    if (errors['alpha']) {
      return `${field.name} can only contain letters and spaces`;
    }

    if (errors['date']) {
      return `${field.name} must be a valid date`;
    }

    if (errors['notEmpty']) {
      return `Please select a ${field.name.toLowerCase()}`;
    }

    // Fallback message
    return `${field.name} is invalid`;
  }

  getErrorTip(field: EntityColumn): string {
    const formControl = this.entityForm.get(field.key);

    if (!formControl || !formControl.errors || !formControl.touched) {
      return '';
    }

    return this.getErrorMessage(field);
  }

  // Modal helpers
  handleCancel(): void {
    this.onCancel();
  }

  handleOk(): void {
    this.onSubmit();
  }

  // Standalone form submission
  onSubmitForm(): void {
    this.onSubmit();
  }

  // Standalone form cancellation
  onCancelForm(): void {
    console.log('Entity form cancel clicked');
    this.onCancel();
  }

  // Reset form
  resetForm(): void {
    this.entityForm.reset();
    this.initializeForm();
  }

  // Get form value for specific field
  getFieldValue(field: EntityColumn): unknown {
    return this.entityForm.get(field.key)?.value;
  }

  // Check if form is dirty
  isFormDirty(): boolean {
    return this.entityForm.dirty;
  }

  // Check if form is valid
  isFormValid(): boolean {
    return this.entityForm.valid;
  }
}
