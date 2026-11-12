import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FoodService } from '../../../../core/services/food.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateFoodData, FoodItem, RecommendedNGO } from '../../../../core/models';
import { FOOD_TYPES, combineDateAndTime } from '../../../../shared/utils/food.constants';
import { foodImage } from '../../../../shared/utils/food-image';
import { confettiBurst } from '../../../../shared/utils/confetti';

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
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-food.component.html',
  styleUrl: './add-food.component.scss'
})
export class AddFoodComponent {
  readonly foodTypes = FOOD_TYPES;
  readonly foodImage = foodImage;
  foodForm: FormGroup;
  isLoading = false;
  isLoadingLocation = false;
  minDate = new Date();

  /** Set after a successful submit; the page then shows a summary instead of the form. */
  createdFood: FoodItem | null = null;
  recommendedNGOs: RecommendedNGO[] = [];
  matchingUnavailable = false;

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    private authService: AuthService,
    private router: Router,
    private notify: NotifyService
  ) {
    this.foodForm = this.buildForm();
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      type: [''],
      quantity: ['', [Validators.required, Validators.min(1), Validators.max(100000)]],
      expirationDate: ['', Validators.required],
      expirationTime: ['21:00', Validators.required],
      pickupLocation: ['', [Validators.required, Validators.maxLength(300)]],
      latitude: ['', [Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.min(-180), Validators.max(180)]]
    });
  }

  get expiryInPast(): boolean {
    const { expirationDate, expirationTime } = this.foodForm.value;
    if (!expirationDate) return false;
    return combineDateAndTime(expirationDate, expirationTime).getTime() <= Date.now();
  }

  getCurrentLocation(): void {
    if (!('geolocation' in navigator)) {
      this.notify.info('Location is not supported by this browser. Please enter it manually.');
      return;
    }
    this.isLoadingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.foodForm.patchValue({
          latitude: +position.coords.latitude.toFixed(6),
          longitude: +position.coords.longitude.toFixed(6)
        });
        this.foodForm.markAsDirty();
        this.isLoadingLocation = false;
        this.notify.success('Location detected');
      },
      () => {
        this.isLoadingLocation = false;
        this.notify.info('Could not get your location. Please enter it manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  onSubmit(): void {
    if (this.foodForm.invalid || this.expiryInPast) {
      this.foodForm.markAllAsTouched();
      if (this.expiryInPast) {
        this.notify.info('The expiry time must be in the future.');
      }
      return;
    }

    this.isLoading = true;
    const v = this.foodForm.value;
    const expiry = combineDateAndTime(v.expirationDate, v.expirationTime);

    const foodData: CreateFoodData = {
      title: String(v.title).trim(),
      type: v.type || undefined,
      quantity: parseInt(v.quantity, 10),
      expirationDate: expiry.toISOString(),
      pickupLocation: String(v.pickupLocation).trim()
    };

    const lat = parseFloat(v.latitude);
    const lng = parseFloat(v.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      foodData.location = { type: 'Point', coordinates: [lng, lat] };
    }

    this.foodService.createFood(foodData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.createdFood = !Array.isArray(response.food) ? response.food : null;
        this.recommendedNGOs = response.recommendedNGOs ?? [];
        this.matchingUnavailable = false;
        this.notify.success('Food listed successfully!');
        confettiBurst();
      },
      error: (error: HttpErrorResponse) => {
        // The backend saves the listing before running the NGO matching engine.
        // If matching fails (e.g. no Maps API key) the request 500s even though
        // the listing exists, so check before reporting a failure.
        if (error.status === 500) {
          this.recoverCreatedListing(foodData, error);
        } else {
          this.isLoading = false;
          this.notify.error(error, 'Failed to add food item. Please try again.');
        }
      }
    });
  }

  private recoverCreatedListing(foodData: CreateFoodData, originalError: HttpErrorResponse): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.isLoading = false;
      this.notify.error(originalError, 'Failed to add food item. Please try again.');
      return;
    }
    const since = Date.now() - 2 * 60 * 1000;
    this.foodService.getMyFoods(userId).subscribe({
      next: (foods) => {
        this.isLoading = false;
        const match = foods.find(f => f.title === foodData.title && new Date(f.createdAt).getTime() >= since);
        if (match) {
          this.createdFood = match;
          this.recommendedNGOs = [];
          this.matchingUnavailable = true;
          this.notify.success('Food listed successfully!');
          confettiBurst();
        } else {
          this.notify.error(originalError, 'Failed to add food item. Please try again.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notify.error(originalError, 'Failed to add food item. Please try again.');
      }
    });
  }

  /** Clicking the selected tile again clears the type. */
  selectType(type: string): void {
    const ctrl = this.foodForm.get('type');
    ctrl?.setValue(ctrl.value === type ? '' : type);
    ctrl?.markAsDirty();
  }

  addAnother(): void {
    this.createdFood = null;
    this.recommendedNGOs = [];
    this.matchingUnavailable = false;
    this.foodForm = this.buildForm();
  }

  goToMyFoods(): void {
    this.router.navigate(['/donor/my-foods']);
  }

  formatDistance(km: number): string {
    if (km == null || isNaN(km)) return 'distance unknown';
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
  }
}
