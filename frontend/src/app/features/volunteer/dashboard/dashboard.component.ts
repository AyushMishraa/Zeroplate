import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatChipsModule,
    StatCardComponent,
    LoadingComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class VolunteerDashboardComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  assignedPickups: any[] = [];
  stats = [
    { value: '0', label: 'Assigned Pickups', icon: 'local_shipping', color: 'volunteer' as const },
    { value: '0', label: 'Completed', icon: 'check_circle', color: 'donor' as const },
    { value: '0 km', label: 'Distance Traveled', icon: 'straighten', color: 'receiver' as const }
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    // TODO: Implement API call to fetch volunteer data
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
  }
}

