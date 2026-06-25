import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { FoodItem } from '../../../../core/models';

// ---- Edit Dialog Component ----
@Component({
  selector: 'app-edit-food-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Food Item</h2>
    <mat-dialog-content>
      <form [formGroup]="editForm" class="edit-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Food Title</mat-label>
          <input matInput formControlName="title">
          <mat-error *ngIf="editForm.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Food Type (Optional)</mat-label>
          <input matInput formControlName="type" placeholder="e.g., Cooked, Raw, Packaged">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quantity (servings)</mat-label>
          <input matInput type="number" formControlName="quantity">
          <mat-error *ngIf="editForm.get('quantity')?.hasError('required')">Quantity is required</mat-error>
          <mat-error *ngIf="editForm.get('quantity')?.hasError('min')">Must be at least 1</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Expiration Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="expirationDate" [min]="minDate">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="editForm.get('expirationDate')?.hasError('required')">Date is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pickup Address</mat-label>
          <textarea matInput formControlName="pickupLocation" rows="2"></textarea>
          <mat-error *ngIf="editForm.get('pickupLocation')?.hasError('required')">Location is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="editForm.invalid || isSaving">
        @if (isSaving) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Save Changes
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .edit-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .full-width { width: 100%; }
    mat-dialog-content { max-height: 70vh; overflow-y: auto; }
  `]
})
export class EditFoodDialogComponent {
  editForm: FormGroup;
  isSaving = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private foodService: FoodService,
    private dialogRef: MatDialogRef<EditFoodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public food: FoodItem
  ) {
    this.editForm = this.fb.group({
      title: [food.title, Validators.required],
      type: [food.type || ''],
      quantity: [food.quantity, [Validators.required, Validators.min(1)]],
      expirationDate: [new Date(food.expirationDate), Validators.required],
      pickupLocation: [food.pickupLocation, Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.invalid) return;
    this.isSaving = true;

    const updates: Partial<FoodItem> = {
      title: this.editForm.value.title,
      type: this.editForm.value.type || undefined,
      quantity: parseInt(this.editForm.value.quantity),
      expirationDate: this.editForm.value.expirationDate,
      pickupLocation: this.editForm.value.pickupLocation
    };

    this.foodService.updateFood(this.food._id, updates).subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }
}

// ---- Main Component ----
@Component({
  selector: 'app-my-foods',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './my-foods.component.html',
  styleUrl: './my-foods.component.scss'
})
export class MyFoodsComponent implements OnInit {
  isLoading = true;
  allFoods: FoodItem[] = [];
  filteredFoods: FoodItem[] = [];
  selectedFilter: string = 'all';

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMyFoods();
  }

  loadMyFoods(): void {
    const userId = this.authService.getUserId();

    this.foodService.getAllFoods().subscribe({
      next: (response) => {
        const allFoods = Array.isArray(response.food) ? response.food : [];

        this.allFoods = allFoods.filter(food => {
          const donorId = typeof food.donor === 'object' ? food.donor._id : food.donor;
          return donorId === userId;
        });

        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load food items', 'Close', { duration: 3000 });
      }
    });
  }

  filterBy(status: string): void {
    this.selectedFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredFoods = this.allFoods;
    } else {
      this.filteredFoods = this.allFoods.filter(food => food.status === this.selectedFilter);
    }
  }

  getFoodCountByStatus(status: string): number {
    if (status === 'all') return this.allFoods.length;
    return this.allFoods.filter(food => food.status === status).length;
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;

    return d.toLocaleDateString();
  }

  editFood(food: FoodItem): void {
    const dialogRef = this.dialog.open(EditFoodDialogComponent, {
      data: food,
      width: '500px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) {
        this.snackBar.open('Food item updated successfully', 'Close', { duration: 3000 });
        this.loadMyFoods();
      }
    });
  }

  deleteFood(food: FoodItem): void {
    if (confirm(`Are you sure you want to delete "${food.title}"?`)) {
      this.foodService.deleteFood(food._id).subscribe({
        next: () => {
          this.snackBar.open('Food item deleted successfully', 'Close', { duration: 3000 });
          this.loadMyFoods();
        },
        error: () => {
          this.snackBar.open('Failed to delete food item', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
