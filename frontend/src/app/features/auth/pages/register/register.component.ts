import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../../../core/services/auth.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { RegisterData, UserRole } from '../../../../core/models';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

import { AuthArtComponent } from '../../../../shared/components/auth-art.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    AuthArtComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  accountForm: FormGroup;
  roleForm: FormGroup;
  locationForm: FormGroup;

  hidePassword = true;
  isLoading = false;
  isLoadingLocation = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notify: NotifyService
  ) {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });

    this.roleForm = this.fb.group({
      role: ['', Validators.required]
    });

    this.locationForm = this.fb.group({
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
    });
  }

  selectRole(role: Extract<UserRole, 'donor' | 'receiver'>): void {
    this.roleForm.patchValue({ role });
  }

  signUpWithGoogle(): void {
    this.authService.googleLogin();
  }

  getCurrentLocation(): void {
    if ('geolocation' in navigator) {
      this.isLoadingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locationForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          this.isLoadingLocation = false;
          this.notify.success('Location detected');
        },
        () => {
          this.isLoadingLocation = false;
          this.notify.info('Could not get your location. Please enter it manually.');
        }
      );
    } else {
      this.notify.info('Location is not supported by this browser. Please enter it manually.');
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid && this.roleForm.valid && this.locationForm.valid) {
      this.isLoading = true;

      const { name, email, password } = this.accountForm.value;
      const registerData: RegisterData = {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password,
        role: this.roleForm.value.role as UserRole,
        location: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(this.locationForm.value.longitude),
            parseFloat(this.locationForm.value.latitude)
          ] as [number, number]
        }
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.success('Account created! Please sign in.');
          this.router.navigate(['/auth/login'], { queryParams: { registered: 1, email: registerData.email } });
        },
        error: (error) => {
          this.isLoading = false;
          this.notify.error(error, 'Registration failed. Please try again.');
        }
      });
    }
  }
}
