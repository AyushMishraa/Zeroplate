import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { FoodItem } from '../../../../core/models';

@Component({
  selector: 'app-donor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DonorDashboardComponent implements OnInit {
  get userName(): string {
    return this.authService.currentUser()?.name || 'Donor';
  }
  isLoading = true;

  stats = {
    activeListings: 0,
    claimedItems: 0,
    pickedUpItems: 0,
    totalMeals: 0,
    helpedPeople: 0
  };

  recentFoods: FoodItem[] = [];

  constructor(
    private authService: AuthService,
    private foodService: FoodService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const userId = this.authService.getUserId();

    this.foodService.getAllFoods().subscribe({
      next: (response) => {
        const allFoods = Array.isArray(response.food) ? response.food : [];

        // Filter user's foods
        const myFoods = allFoods.filter(food => {
          const donorId = typeof food.donor === 'object' ? food.donor._id : food.donor;
          return donorId === userId;
        });

        // Calculate stats
        this.stats.activeListings = myFoods.filter(f => f.status === 'available').length;
        this.stats.claimedItems = myFoods.filter(f => f.status === 'claimed').length;
        this.stats.pickedUpItems = myFoods.filter(f => f.status === 'picked_up').length;
        this.stats.totalMeals = myFoods.reduce((sum, f) => sum + f.quantity, 0);
        this.stats.helpedPeople = this.stats.pickedUpItems * 10; // Estimate

        // Get recent foods (last 5)
        this.recentFoods = myFoods
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
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
    return `in ${diffDays} days`;
  }

  calculateCO2Reduction(): number {
    // Estimate: 1 meal saved = 2.5 kg CO2 reduction
    return Math.round(this.stats.totalMeals * 2.5);
  }
}
