import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { FoodItem } from '../../../../core/models';
import { co2Saved, expiresLabel, isUrgent } from '../../../../shared/utils/date.utils';
import { foodImage } from '../../../../shared/utils/food-image';
import { confettiBurst } from '../../../../shared/utils/confetti';
import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { GoalRingComponent } from '../../../../shared/components/goal-ring.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';

const DEFAULT_GOAL = 50;

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
    SkeletonComponent,
    EmptyStateComponent,
    GoalRingComponent,
    RevealDirective,
    CountUpDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DonorDashboardComponent implements OnInit {
  readonly userName = this.authService.currentUser()?.name || 'Donor';
  isLoading = true;
  loadError = false;

  stats = {
    activeListings: 0,
    claimedItems: 0,
    pickedUpItems: 0,
    mealsSaved: 0,
    servingsListed: 0
  };

  recentFoods: FoodItem[] = [];
  expiringSoon: FoodItem[] = [];
  mealsThisMonth = 0;
  monthlyGoal = DEFAULT_GOAL;
  readonly foodImage = foodImage;

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private notify: NotifyService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isLoading = true;
    this.loadError = false;

    this.foodService.getMyFoods(userId).subscribe({
      next: (myFoods) => {
        this.stats.activeListings = myFoods.filter(f => f.status === 'available').length;
        this.stats.claimedItems = myFoods.filter(f => f.status === 'claimed').length;
        this.stats.pickedUpItems = myFoods.filter(f => f.status === 'picked_up').length;
        this.stats.mealsSaved = myFoods
          .filter(f => f.status === 'claimed' || f.status === 'picked_up')
          .reduce((sum, f) => sum + (f.quantity || 0), 0);
        this.stats.servingsListed = myFoods.reduce((sum, f) => sum + (f.quantity || 0), 0);

        this.recentFoods = [...myFoods]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        this.expiringSoon = myFoods.filter(f => f.status === 'available' && isUrgent(f.expirationDate));

        const now = new Date();
        this.mealsThisMonth = myFoods
          .filter(f => f.status === 'claimed' || f.status === 'picked_up')
          .filter(f => {
            const d = new Date(f.createdAt);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
          })
          .reduce((sum, f) => sum + (f.quantity || 0), 0);
        this.monthlyGoal = this.loadGoal();
        setTimeout(() => this.celebrateIfReached(), 900);

        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load your dashboard.');
      }
    });
  }

  formatDate(date: Date | string): string {
    return expiresLabel(date);
  }

  statusLabel(status: string): string {
    return status === 'picked_up' ? 'Picked up' : status.charAt(0).toUpperCase() + status.slice(1);
  }

  setGoal(goal: number): void {
    this.monthlyGoal = goal;
    try { localStorage.setItem(this.goalKey(), String(goal)); } catch { /* ignore */ }
    this.celebrateIfReached();
  }

  private loadGoal(): number {
    try {
      const n = Number(localStorage.getItem(this.goalKey()));
      return n > 0 ? n : DEFAULT_GOAL;
    } catch {
      return DEFAULT_GOAL;
    }
  }

  /** Confetti once per month per goal value when the goal is met. */
  private celebrateIfReached(): void {
    if (this.mealsThisMonth < this.monthlyGoal) return;
    const now = new Date();
    const key = `${this.goalKey()}_done_${now.getFullYear()}-${now.getMonth()}`;
    try {
      if (localStorage.getItem(key) === String(this.monthlyGoal)) return;
      localStorage.setItem(key, String(this.monthlyGoal));
    } catch { /* ignore */ }
    confettiBurst();
  }

  private goalKey(): string {
    return `zp_goal_${this.authService.getUserId() ?? 'anon'}`;
  }

  calculateCO2Reduction(): number {
    return co2Saved(this.stats.mealsSaved);
  }
}
