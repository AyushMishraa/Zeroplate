import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { ClaimService } from '../../../../core/services/claim.service';
import { FoodItem, Claim } from '../../../../core/models';

@Component({
  selector: 'app-receiver-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class ReceiverDashboardComponent implements OnInit {
  userName(): string {
    return this.authService.currentUser()?.name || 'Receiver';
  }
  isLoading = true;

  stats = {
    availableFood: 0,
    myClaims: 0,
    pendingPickups: 0,
    completed: 0,
    totalMealsReceived: 0
  };

  nearbyFoods: FoodItem[] = [];
  recentClaims: Claim[] = [];

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private claimService: ClaimService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load available foods
    this.foodService.getAvailableFoods().subscribe({
      next: (response) => {
        this.nearbyFoods = Array.isArray(response.food) ? response.food : [];
        this.stats.availableFood = this.nearbyFoods.length;
      },
      error: () => {
        this.nearbyFoods = [];
      }
    });

    // Load my claims
    this.claimService.getMyClaims().subscribe({
      next: (response) => {
        this.recentClaims = Array.isArray(response.claims) ? response.claims : [];
        this.stats.myClaims = this.recentClaims.length;
        this.stats.pendingPickups = this.recentClaims.filter(c => c.status === 'pending' || c.status === 'approved').length;
        this.stats.completed = this.recentClaims.filter(c => c.status === 'completed').length;

        // Calculate total meals
        this.stats.totalMealsReceived = this.recentClaims
          .filter(c => c.status === 'completed')
          .reduce((sum, claim) => {
            const food = claim.food as FoodItem;
            return sum + (food?.quantity || 0);
          }, 0);

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
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
    if (diffDays < 7) return `in ${diffDays} days`;

    return d.toLocaleDateString();
  }

  getDonorName(food: FoodItem): string {
    if (typeof food.donor === 'object') {
      return food.donor.name;
    }
    return 'Unknown';
  }

  getFoodTitle(claim: Claim): string {
    if (typeof claim.food === 'object') {
      return claim.food.title;
    }
    return 'Food Item';
  }

  getClaimIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'pending',
      approved: 'check_circle',
      completed: 'done_all',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

  calculateCO2Saved(): number {
    return Math.round(this.stats.totalMealsReceived * 2.5);
  }
}
