import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, forkJoin, of } from 'rxjs';
import { ClaimService } from '../../../../core/services/claim.service';
import { FoodService } from '../../../../core/services/food.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { Claim, ClaimStatus, FoodItem, isFoodObject } from '../../../../core/models';
import { expiresLabel, timeAgo } from '../../../../shared/utils/date.utils';

type ClaimFilter = 'all' | ClaimStatus;

import { foodImage } from '../../../../shared/utils/food-image';
import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-my-claims',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SkeletonComponent,
    EmptyStateComponent,
    RevealDirective
  ],
  templateUrl: './my-claims.component.html',
  styleUrl: './my-claims.component.scss'
})
export class MyClaimsComponent implements OnInit {
  readonly foodImage = foodImage;
  readonly trackerSteps = [
    { key: 'pending', label: 'Claimed', icon: 'shopping_basket' },
    { key: 'approved', label: 'Approved', icon: 'thumb_up' },
    { key: 'completed', label: 'Picked up', icon: 'local_shipping' }
  ];

  /** 0 = claimed, 1 = approved, 2 = picked up. */
  trackerIndex(claim: Claim): number {
    switch (this.status(claim)) {
      case 'completed': return 2;
      case 'approved': return 1;
      default: return 0;
    }
  }

  readonly filters: ClaimFilter[] = ['all', 'pending', 'approved', 'completed', 'rejected'];
  isLoading = true;
  loadError = false;
  allClaims: Claim[] = [];
  filteredClaims: Claim[] = [];
  selectedFilter: ClaimFilter = 'all';

  /** Donor names keyed by donor id. Claims only carry the donor id, so we look them up from the listings. */
  private donorNames = new Map<string, string>();

  constructor(
    private claimService: ClaimService,
    private foodService: FoodService,
    private notify: NotifyService
  ) { }

  ngOnInit(): void {
    this.loadMyClaims();
  }

  loadMyClaims(): void {
    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      claims: this.claimService.getMyClaims(),
      foods: this.foodService.getAllFoods().pipe(catchError(() => of([] as FoodItem[])))
    }).subscribe({
      next: ({ claims, foods }) => {
        this.donorNames.clear();
        for (const f of foods) {
          if (f.donor && typeof f.donor === 'object') {
            this.donorNames.set(f.donor._id, f.donor.name);
          }
        }
        this.allClaims = claims;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load your claims.');
      }
    });
  }

  filterBy(status: ClaimFilter): void {
    this.selectedFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredClaims = this.selectedFilter === 'all'
      ? this.allClaims
      : this.allClaims.filter(claim => this.status(claim) === this.selectedFilter);
  }

  getClaimCount(status: ClaimFilter): number {
    return status === 'all' ? this.allClaims.length : this.allClaims.filter(c => this.status(c) === status).length;
  }

  /**
   * The backend has no endpoint to move a claim out of "pending", so treat a
   * claim as completed once the donor marks the food as picked up.
   */
  status(claim: Claim): ClaimStatus {
    return this.isPickedUp(claim) && claim.status !== 'rejected' ? 'completed' : claim.status;
  }

  filterLabel(status: ClaimFilter): string {
    return status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
  }

  hasFood(claim: Claim): boolean {
    return isFoodObject(claim.food);
  }

  getFoodTitle(claim: Claim): string {
    return isFoodObject(claim.food) ? claim.food.title : 'Listing no longer available';
  }

  getFoodQuantity(claim: Claim): number {
    return isFoodObject(claim.food) ? claim.food.quantity : 0;
  }

  getFoodType(claim: Claim): string | null {
    return isFoodObject(claim.food) ? claim.food.type ?? null : null;
  }

  getDonorName(claim: Claim): string {
    if (!isFoodObject(claim.food)) return 'Unknown';
    const donor = claim.food.donor;
    if (donor && typeof donor === 'object') return donor.name;
    return (donor && this.donorNames.get(donor)) || 'Unknown donor';
  }

  getPickupLocation(claim: Claim): string {
    return isFoodObject(claim.food) ? claim.food.pickupLocation : 'Unknown';
  }

  getExpiry(claim: Claim): string | null {
    return isFoodObject(claim.food) ? expiresLabel(claim.food.expirationDate) : null;
  }

  isPickedUp(claim: Claim): boolean {
    return isFoodObject(claim.food) && claim.food.status === 'picked_up';
  }

  mapsLink(claim: Claim): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.getPickupLocation(claim))}`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'pending',
      approved: 'check_circle',
      completed: 'done_all',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

  formatDate(date: Date | string): string {
    return timeAgo(date);
  }
}
