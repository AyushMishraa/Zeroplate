import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../../core/services/admin.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { DashboardStats, PendingPickup } from '../../../../core/models';
import { ChartComponent, CHART_COLORS } from '../../../../shared/components/chart.component';
import { timeAgo } from '../../../../shared/utils/date.utils';

import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-admin-dashboard',
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  isLoading = true;
  loadError = false;
  pickupsLoading = true;
  stats: DashboardStats | null = null;
  pendingPickups: PendingPickup[] = [];
  displayedColumns = ['food', 'donor', 'receiver', 'status', 'date'];

  dailyLabels: string[] = [];
  dailyDatasets: ChartComponent['datasets'] = [];
  typeLabels: string[] = [];
  typeDatasets: ChartComponent['datasets'] = [];

  constructor(private adminService: AdminService, private notify: NotifyService) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loadDashboardData();
    this.loadPendingPickups();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadError = false;
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.buildCharts(stats);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load dashboard statistics.');
      }
    });
  }

  loadPendingPickups(): void {
    this.pickupsLoading = true;
    this.adminService.getPendingPickups().subscribe({
      next: (pickups) => {
        this.pendingPickups = pickups;
        this.pickupsLoading = false;
      },
      error: (error) => {
        this.pickupsLoading = false;
        this.notify.error(error, 'Failed to load pending pickups.');
      }
    });
  }

  private buildCharts(stats: DashboardStats): void {
    // Backend only returns days that had donations; fill in the full last 7 days.
    const byDay = new Map(stats.donationsPerDay.map(d => [d._id, d]));
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    this.dailyLabels = days.map(d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }));
    this.dailyDatasets = [
      {
        label: 'Listings',
        data: days.map(d => byDay.get(d)?.count ?? 0),
        backgroundColor: CHART_COLORS[0],
        borderRadius: 6
      },
      {
        label: 'Servings',
        data: days.map(d => byDay.get(d)?.totalQuantity ?? 0),
        backgroundColor: CHART_COLORS[1],
        borderRadius: 6
      }
    ];

    this.typeLabels = stats.foodByType.map(t => t._id || 'Unspecified');
    this.typeDatasets = [{
      label: 'Listings',
      data: stats.foodByType.map(t => t.count),
      backgroundColor: stats.foodByType.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])
    }];
  }

  get hasDailyData(): boolean {
    return !!this.stats?.donationsPerDay.length;
  }

  getPercentage(count: number): number {
    if (!this.stats?.foodByType) return 0;
    const total = this.stats.foodByType.reduce((sum, type) => sum + type.count, 0);
    return total > 0 ? (count / total) * 100 : 0;
  }

  formatDate(date: Date | string): string {
    return timeAgo(date);
  }
}
