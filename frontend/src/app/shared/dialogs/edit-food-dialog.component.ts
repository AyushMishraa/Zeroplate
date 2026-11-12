import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FoodItem, FoodStatus, UpdateFoodData } from '../../core/models';
import { FoodService } from '../../core/services/food.service';
import { NotifyService } from '../../core/services/notify.service';
import { FOOD_TYPES, combineDateAndTime, toTimeString } from '../utils/food.constants';

@Component({
  selector: 'app-edit-food-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Edit listing</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Food title</mat-label>
          <input matInput formControlName="title" maxlength="100">
          @if (form.get('title')?.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Food type</mat-label>
            <mat-select formControlName="type">
              <mat-option value="">Not specified</mat-option>
              @for (t of foodTypes; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Quantity (servings)</mat-label>
            <input matInput type="number" min="1" formControlName="quantity">
            @if (form.get('quantity')?.invalid) {
              <mat-error>Enter at least 1</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Expiry date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="expirationDate">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if (form.get('expirationDate')?.hasError('required')) {
              <mat-error>Expiry date is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Expiry time</mat-label>
            <input matInput type="time" formControlName="expirationTime">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pickup address</mat-label>
          <textarea matInput rows="2" formControlName="pickupLocation"></textarea>
          @if (form.get('pickupLocation')?.hasError('required')) {
            <mat-error>Pickup address is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="saving">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving || form.pristine">
          @if (saving) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            Save changes
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .content { display: flex; flex-direction: column; min-width: min(520px, 80vw); padding-top: 8px !important; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
  `]
})
export class EditFoodDialogComponent {
  readonly foodTypes = FOOD_TYPES;
  readonly statuses: { value: FoodStatus; label: string }[] = [
    { value: 'available', label: 'Available' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'picked_up', label: 'Picked up' },
    { value: 'expired', label: 'Expired' }
  ];

  form: FormGroup;
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public food: FoodItem,
    private dialogRef: MatDialogRef<EditFoodDialogComponent, FoodItem | undefined>,
    private fb: FormBuilder,
    private foodService: FoodService,
    private notify: NotifyService
  ) {
    const typeKnown = !food.type || FOOD_TYPES.includes(food.type);
    if (!typeKnown) {
      this.foodTypes = [...FOOD_TYPES, food.type as string];
    }
    this.form = this.fb.group({
      title: [food.title, [Validators.required, Validators.maxLength(100)]],
      type: [food.type ?? ''],
      quantity: [food.quantity, [Validators.required, Validators.min(1)]],
      expirationDate: [new Date(food.expirationDate), Validators.required],
      expirationTime: [toTimeString(food.expirationDate)],
      pickupLocation: [food.pickupLocation, Validators.required],
      status: [food.status, Validators.required]
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const v = this.form.value;
    const updates: UpdateFoodData = {
      title: String(v.title).trim(),
      type: v.type || undefined,
      quantity: Number(v.quantity),
      expirationDate: combineDateAndTime(v.expirationDate, v.expirationTime).toISOString(),
      pickupLocation: String(v.pickupLocation).trim(),
      status: v.status
    };

    this.foodService.updateFood(this.food._id, updates).subscribe({
      next: (response) => {
        this.saving = false;
        this.notify.success('Listing updated');
        const updated = !Array.isArray(response.food) && response.food ? response.food : { ...this.food, ...updates };
        // Keep the populated donor from the list view.
        this.dialogRef.close({ ...this.food, ...updated, donor: this.food.donor } as FoodItem);
      },
      error: (error) => {
        this.saving = false;
        this.notify.error(error, 'Could not update the listing.');
      }
    });
  }
}
