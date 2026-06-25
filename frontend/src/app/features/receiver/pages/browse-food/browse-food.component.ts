import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FoodService } from '../../../../core/services/food.service';
import { ClaimService } from '../../../../core/services/claim.service';
import { FoodItem } from '../../../../core/models';

@Component({
  selector: 'app-browse-food',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './browse-food.component.html',
  styleUrls: ['./browse-food.component.scss']
})
export class BrowseFoodComponent implements OnInit {
  isLoading = true;
  isClaimingFood: string | null = null;
  allFoods: FoodItem[] = [];
  filteredFoods: FoodItem[] = [];
  availableTypes: string[] = [];
  searchQuery = '';
  selectedType = 'all';

  constructor(
    private foodService: FoodService,
    private claimService: ClaimService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadAvailableFoods();
  }

  loadAvailableFoods(): void {
    this.foodService.getAvailableFoods().subscribe({
      next: (response) => {
        this.allFoods = Array.isArray(response.food) ? response.food : [];
        // Extract unique types for filter chips
        this.availableTypes = [...new Set(
          this.allFoods.map(f => f.type?.toLowerCase()).filter((t): t is string => !!t)
        )];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load foods:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load available food', 'Close', { duration: 3000 });
      }
    });
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.allFoods;

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(food =>
        food.type?.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(food =>
        food.title.toLowerCase().includes(query) ||
        food.type?.toLowerCase().includes(query)
      );
    }

    this.filteredFoods = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = 'all';
    this.applyFilters();
  }

  claimFood(food: FoodItem): void {
    this.isClaimingFood = food._id;

    this.claimService.createClaim(food._id).subscribe({
      next: (response) => {
        this.isClaimingFood = null;
        this.snackBar.open('Food claimed successfully!', 'Close', { duration: 3000 });

        // Remove from available list
        this.allFoods = this.allFoods.filter(f => f._id !== food._id);
        this.applyFilters();
      },
      error: (error) => {
        this.isClaimingFood = null;
        this.snackBar.open(
          error.error?.message || 'Failed to claim food',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays} days`;
  }

  getDonorName(food: FoodItem): string {
    if (typeof food.donor === 'object') {
      return food.donor.name;
    }
    return 'Unknown Donor';
  }

  isUrgent(food: FoodItem): boolean {
    const d = new Date(food.expirationDate);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours < 24;
  }

  getUrgencyText(food: FoodItem): string {
    return this.isUrgent(food) ? 'Urgent' : 'Available';
  }
}
