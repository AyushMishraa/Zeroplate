import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../../../core/services/auth.service';

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
    MatSnackBarModule,
    MatStepperModule
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
    private snackBar: MatSnackBar
  ) {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.roleForm = this.fb.group({
      role: ['', Validators.required]
    });

    this.locationForm = this.fb.group({
      latitude: ['', Validators.required],
      longitude: ['', Validators.required]
    });
  }

  selectRole(role: 'donor' | 'receiver'): void {
    this.roleForm.patchValue({ role });
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
          this.snackBar.open('Location detected!', 'Close', { duration: 2000 });
        },
        (error) => {
          this.isLoadingLocation = false;
          this.snackBar.open('Could not get location. Please enter manually.', 'Close', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('Geolocation is not supported by your browser.', 'Close', { duration: 3000 });
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid && this.roleForm.valid && this.locationForm.valid) {
      this.isLoading = true;

      const registerData = {
        ...this.accountForm.value,
        ...this.roleForm.value,
        location: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(this.locationForm.value.longitude),
            parseFloat(this.locationForm.value.latitude)
          ]
        }
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Registration successful! Welcome to ZeroPlate!', 'Close', { duration: 3000 });
          this.authService.redirectAfterLogin();
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            error.error?.message || 'Registration failed. Please try again.',
            'Close',
            { duration: 5000 }
          );
        }
      });
    }
  }
}
