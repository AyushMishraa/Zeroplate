import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FraudData } from '../../../../core/models';

@Component({
  selector: 'app-fraud',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fraud.component.html',
  styleUrl: './fraud.component.scss'
})
export class FraudComponent implements OnInit {
  isLoading = true;
  fraudData: FraudData | null = null;

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit(): void {
    this.loadFraudData();
  }

  // Public so the retry button in the template can call it
  loadFraudData(): void {
    this.isLoading = true;
    this.analyticsService.getFraudData(60, 5).subscribe({
      next: (response) => {
        this.fraudData = response.data ?? null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load fraud data:', error);
        this.isLoading = false;
      }
    });
  }
}
