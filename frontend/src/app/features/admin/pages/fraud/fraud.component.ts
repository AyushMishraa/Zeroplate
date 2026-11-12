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
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FoodService } from '../../../../core/services/food.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { DonorRef, FoodItem, FraudData } from '../../../../core/models';

import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-fraud',
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
    MatTooltipModule,
    SkeletonComponent,
    RevealDirective,
    CountUpDirective
  ],
  templateUrl: './fraud.component.html',
  styleUrl: './fraud.component.scss'
})
export class FraudComponent implements OnInit {
  isLoading = true;
  loadError = false;
  fraudData: FraudData | null = null;
  lastChecked: Date | null = null;

  /** Rule settings sent to the backend. */
  recentMinutes = 60;
  rapidThreshold = 5;

  private donors = new Map<string, DonorRef>();
  private foods = new Map<string, FoodItem>();

  constructor(
    private analyticsService: AnalyticsService,
    private foodService: FoodService,
    private notify: NotifyService
  ) { }

  ngOnInit(): void {
    this.loadFraudData();
  }

  // Public so the retry button in the template can call it
  loadFraudData(): void {
    const minutes = Math.max(1, Math.round(Number(this.recentMinutes) || 60));
    const threshold = Math.max(2, Math.round(Number(this.rapidThreshold) || 5));
    this.recentMinutes = minutes;
    this.rapidThreshold = threshold;

    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      fraud: this.analyticsService.getFraudData(minutes, threshold),
      foods: this.foodService.getAllFoods().pipe(catchError(() => of([] as FoodItem[])))
    }).subscribe({
      next: ({ fraud, foods }) => {
        this.fraudData = fraud;
        this.donors.clear();
        this.foods.clear();
        for (const f of foods) {
          this.foods.set(f._id, f);
          if (f.donor && typeof f.donor === 'object') this.donors.set(f.donor._id, f.donor);
        }
        this.lastChecked = new Date();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load fraud detection data.');
      }
    });
  }

  get totalAlerts(): number {
    const d = this.fraudData;
    return d ? d.duplicateClaimsCount + d.rapidClaimUsersCount + d.suspiciousDonorsCount : 0;
  }

  donorLabel(id: string): string {
    const donor = this.donors.get(id);
    return donor ? `${donor.name} (${donor.email})` : this.shortId(id);
  }

  foodLabel(id: string): string {
    return this.foods.get(id)?.title ?? this.shortId(id);
  }

  shortId(id: unknown): string {
    const s = String(id ?? '');
    return s.length > 10 ? `…${s.slice(-8)}` : s || 'unknown';
  }

  copy(id: unknown): void {
    const text = String(id ?? '');
    navigator.clipboard?.writeText(text).then(
      () => this.notify.info('ID copied'),
      () => this.notify.info(text)
    );
  }
}
