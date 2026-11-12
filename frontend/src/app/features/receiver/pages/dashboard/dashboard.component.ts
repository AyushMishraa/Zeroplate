import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { ClaimService } from '../../../../core/services/claim.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { FoodItem, Claim, isFoodObject } from '../../../../core/models';
import { co2Saved, expiresLabel, isExpired, isUrgent, timeAgo } from '../../../../shared/utils/date.utils';
import { foodImage } from '../../../../shared/utils/food-image';
import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';


@Component({
  selector: 'app-receiver-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SkeletonComponent,
    EmptyStateComponent,
    RevealDirective,
    CountUpDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class ReceiverDashboardComponent implements OnInit {
  readonly foodImage = foodImage;
  isLoading = true;
  loadError = false;

  stats = {
    availableFood: 0,
    myClaims: 0,
    pendingPickups: 0,
    completed: 0,
    totalMealsReceived: 0
  };

  nearbyFoods: FoodItem[] = [];
  urgentCount = 0;
  recentClaims: Claim[] = [];

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private claimService: ClaimService,
    private notify: NotifyService
  ) { }

  userName(): string {
    return this.authService.currentUser()?.name || 'Receiver';
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      foods: this.foodService.getAvailableFoods().pipe(catchError(() => of(null))),
      claims: this.claimService.getMyClaims()
    }).subscribe({
      next: ({ foods, claims }) => {
        const available = (foods ?? []).filter(f => !isExpired(f.expirationDate));
        // Most urgent first so receivers see what needs collecting soonest.
        this.nearbyFoods = [...available].sort(
          (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
        );
        this.urgentCount = available.filter(f => isUrgent(f.expirationDate)).length;
        this.stats.availableFood = available.length;

        this.recentClaims = claims;
        this.stats.myClaims = claims.length;
        this.stats.completed = claims.filter(c => this.isDone(c)).length;
        this.stats.pendingPickups = claims.filter(c =>
          (c.status === 'pending' || c.status === 'approved') && !this.isDone(c)
        ).length;
        this.stats.totalMealsReceived = claims
          .filter(c => c.status !== 'rejected')
          .reduce((sum, c) => sum + (isFoodObject(c.food) ? c.food.quantity || 0 : 0), 0);

        if (foods === null) {
          this.notify.info('Could not load available food right now.');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load your dashboard.');
      }
    });
  }

  /** A claim is done when marked completed, or when the donor marked the food picked up. */
  private isDone(claim: Claim): boolean {
    return claim.status === 'completed' || (isFoodObject(claim.food) && claim.food.status === 'picked_up');
  }

  formatDate(date: Date | string): string {
    return expiresLabel(date);
  }

  claimedAgo(date: Date | string): string {
    return timeAgo(date);
  }

  isUrgent(food: FoodItem): boolean {
    return isUrgent(food.expirationDate);
  }

  getDonorName(food: FoodItem): string {
    return typeof food.donor === 'object' && food.donor ? food.donor.name : 'Unknown';
  }

  getFoodTitle(claim: Claim): string {
    return isFoodObject(claim.food) ? claim.food.title : 'Listing removed';
  }

  claimStatus(claim: Claim): string {
    return this.isDone(claim) ? 'completed' : claim.status;
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
    return co2Saved(this.stats.totalMealsReceived);
  }
}
