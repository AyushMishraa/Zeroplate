import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, of } from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FoodService } from '../../../../core/services/food.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { AnalyticsSummary, FoodItem, TopDonor } from '../../../../core/models';
import { ChartComponent, CHART_COLORS } from '../../../../shared/components/chart.component';
import { co2Saved } from '../../../../shared/utils/date.utils';

import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ChartComponent,
    SkeletonComponent,
    RevealDirective,
    CountUpDirective
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  isLoading = true;
  loadError = false;
  summary: AnalyticsSummary | null = null;
  topDonors: TopDonor[] = [];
  displayedColumns = ['rank', 'name', 'email', 'donations', 'quantity'];

  statusLabels: string[] = [];
  statusDatasets: ChartComponent['datasets'] = [];
  donorLabels: string[] = [];
  donorDatasets: ChartComponent['datasets'] = [];

  constructor(
    private analyticsService: AnalyticsService,
    private foodService: FoodService,
    private notify: NotifyService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      summary: this.analyticsService.getAnalyticsSummary(),
      donors: this.analyticsService.getTopDonors(10),
      foods: this.foodService.getAllFoods().pipe(catchError(() => of([] as FoodItem[])))
    }).subscribe({
      next: ({ summary, donors, foods }) => {
        this.summary = summary;
        this.topDonors = donors;
        this.buildCharts(foods, donors);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load analytics.');
      }
    });
  }

  private buildCharts(foods: FoodItem[], donors: TopDonor[]): void {
    const statuses: { key: FoodItem['status']; label: string }[] = [
      { key: 'available', label: 'Available' },
      { key: 'claimed', label: 'Claimed' },
      { key: 'picked_up', label: 'Picked up' },
      { key: 'expired', label: 'Expired' }
    ];
    this.statusLabels = statuses.map(s => s.label);
    this.statusDatasets = [{
      label: 'Listings',
      data: statuses.map(s => foods.filter(f => f.status === s.key).length),
      backgroundColor: [CHART_COLORS[0], CHART_COLORS[2], CHART_COLORS[1], CHART_COLORS[3]]
    }];

    const top = donors.slice(0, 5);
    this.donorLabels = top.map(d => d.donor?.name ?? 'Unknown');
    this.donorDatasets = [{
      label: 'Servings donated',
      data: top.map(d => d.totalQuantity),
      backgroundColor: CHART_COLORS[0],
      borderRadius: 6
    }];
  }

  get hasStatusData(): boolean {
    return (this.statusDatasets[0]?.data as number[] | undefined)?.some(v => v > 0) ?? false;
  }

  claimRate(): number {
    if (!this.summary?.totalDonations) return 0;
    return Math.round((this.summary.totalClaims / this.summary.totalDonations) * 100);
  }

  calculateCO2(): number {
    return co2Saved(this.summary?.totalMealsSaved || 0);
  }
}
