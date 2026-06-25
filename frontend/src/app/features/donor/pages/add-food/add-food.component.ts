import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FoodService } from '../../../../core/services/food.service';

@Component({
  selector: 'app-add-food',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './add-food.component.html',
  styleUrl: './add-food.component.scss'
})
export class AddFoodComponent {
  foodForm: FormGroup;
  isLoading = false;
  isLoadingLocation = false;
  minDate = new Date();
  recommendedNGOs: any[] = [];
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    private snackBar: MatSnackBar
  ) {
    this.foodForm = this.fb.group({
      title: ['', Validators.required],
      type: [''],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expirationDate: ['', Validators.required],
      pickupLocation: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required]
    });
  }

  getCurrentLocation(): void {
    if ('geolocation' in navigator) {
      this.isLoadingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.foodForm.patchValue({
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
    }
  }

  onSubmit(): void {
    if (this.foodForm.valid) {
      this.isLoading = true;

      const foodData = {
        title: this.foodForm.value.title,
        type: this.foodForm.value.type,
        quantity: parseInt(this.foodForm.value.quantity),
        expirationDate: this.foodForm.value.expirationDate,
        pickupLocation: this.foodForm.value.pickupLocation,
        location: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(this.foodForm.value.longitude),
            parseFloat(this.foodForm.value.latitude)
          ] as [number, number]
        }
      };

      this.foodService.createFood(foodData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.submitted = true;

          if (response.recommendedNGOs && response.recommendedNGOs.length > 0) {
            this.recommendedNGOs = response.recommendedNGOs.map((ngo: any) => ({
              id: ngo._id,
              name: ngo.name,
              distance: (ngo.distance / 1000).toFixed(1)
            }));
          }

          this.snackBar.open('Food item added successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            error.error?.message || 'Failed to add food item. Please try again.',
            'Close',
            { duration: 5000 }
          );
        }
      });
    }
  }
}
