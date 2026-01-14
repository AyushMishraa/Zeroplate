import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatToolbarModule,
    MatMenuModule,
    StatCardComponent,
    LoadingComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  stats = [
    { value: '0', label: 'Total Users', icon: 'people', color: 'default' as const },
    { value: '0', label: 'Food Items', icon: 'restaurant', color: 'donor' as const },
    { value: '0', label: 'Total Claims', icon: 'shopping_cart', color: 'receiver' as const },
    { value: '0', label: 'Pending Pickups', icon: 'pending', color: 'volunteer' as const }
  ];

  constructor(
    public authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.stats) {
          this.stats = [
            { value: response.stats.totalUsers.toString(), label: 'Total Users', icon: 'people', color: 'default' as const },
            { value: response.stats.totalFoodItems.toString(), label: 'Food Items', icon: 'restaurant', color: 'donor' as const },
            { value: response.stats.totalClaims.toString(), label: 'Total Claims', icon: 'shopping_cart', color: 'receiver' as const },
            { value: response.stats.pendingPickups.toString(), label: 'Pending Pickups', icon: 'pending', color: 'volunteer' as const }
          ];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

