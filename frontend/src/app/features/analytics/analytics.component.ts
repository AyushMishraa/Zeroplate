import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    StatCardComponent,
    LoadingComponent
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  stats = [
    { value: '0', label: 'Food Saved (kg)', icon: 'restaurant', color: 'donor' as const },
    { value: '0', label: 'Meals Provided', icon: 'dining', color: 'receiver' as const },
    { value: '0', label: 'CO₂ Reduced (kg)', icon: 'eco', color: 'default' as const },
    { value: '0', label: 'Communities Served', icon: 'groups', color: 'volunteer' as const }
  ];

  constructor(
    public authService: AuthService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.analyticsService.getSummary().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = [
            { value: response.data.totalMealsSaved.toString(), label: 'Food Saved (kg)', icon: 'restaurant', color: 'donor' as const },
            { value: response.data.totalMealsSaved.toString(), label: 'Meals Provided', icon: 'dining', color: 'receiver' as const },
            { value: '0', label: 'CO₂ Reduced (kg)', icon: 'eco', color: 'default' as const },
            { value: response.data.activeReceivers.toString(), label: 'Communities Served', icon: 'groups', color: 'volunteer' as const }
          ];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

