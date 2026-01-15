import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, User } from '../../../core/services/auth.service';
import { FoodService, AddFoodRequest } from '../../../core/services/food.service';

@Component({
  selector: 'app-add-food',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatMenuModule
  ],
  templateUrl: './add-food.component.html',
  styleUrls: ['./add-food.component.scss']
})
export class AddFoodComponent implements OnInit {
  addFoodForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  foodCategories = [
    'Fruits & Vegetables',
    'Bakery Items',
    'Dairy Products',
    'Prepared Meals',
    'Beverages',
    'Snacks',
    'Other'
  ];
  quantityUnits = ['kg', 'lbs', 'pieces', 'liters', 'packages'];

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private foodService: FoodService
  ) {
    this.addFoodForm = this.fb.group({
      foodName: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expiryDate: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.addFoodForm.valid) {
      this.isLoading = true;
      
      const formValue = this.addFoodForm.value;
      const foodData: AddFoodRequest = {
        title: formValue.foodName,
        type: formValue.category,
        quantity: Number(formValue.quantity),
        expirationDate: formValue.expiryDate,
        pickupLocation: formValue.location,
        status: 'available',
        location: {
          type: 'Point',
          coordinates: [0, 0] // TODO: Get actual coordinates from location
        }
      };

      this.foodService.addFoodItem(foodData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Food listing created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['info-snackbar']
          });
          this.addFoodForm.reset();
          setTimeout(() => {
            this.router.navigate(['/browse-food']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            error.error?.message || 'Failed to create food listing. Please try again.',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addFoodForm.controls).forEach(key => {
      this.addFoodForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.addFoodForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} is too short`;
    }
    if (control?.hasError('min')) {
      return 'Quantity must be at least 1';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      foodName: 'Food name',
      category: 'Category',
      quantity: 'Quantity',
      expiryDate: 'Expiry date',
      location: 'Location'
    };
    return labels[fieldName] || fieldName;
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'donor': return 'bg-green-100 text-green-800';
      case 'receiver': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'donor': return 'Donor';
      case 'receiver': return 'Receiver';
      case 'admin': return 'Admin';
      default: return role;
    }
  }
}









