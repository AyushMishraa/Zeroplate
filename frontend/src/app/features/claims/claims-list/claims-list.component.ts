import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../core/services/auth.service';
import { ClaimService } from '../../../core/services/claim.service';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
    LoadingComponent,
    EmptyStateComponent
  ],
  templateUrl: './claims-list.component.html',
  styleUrls: ['./claims-list.component.scss']
})
export class ClaimsListComponent implements OnInit {
  currentUser: any = null;
  isLoading = false;
  claims: any[] = [];

  constructor(
    public authService: AuthService,
    private claimService: ClaimService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading = true;
    this.claimService.getClaims().subscribe({
      next: (response) => {
        if (response.success) {
          this.claims = response.claims || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.snackBar.open('Failed to load claims. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getFoodTitle(claim: any): string {
    if (typeof claim.food === 'object' && claim.food?.title) {
      return claim.food.title;
    }
    return 'Food Item';
  }

  getFoodType(claim: any): string {
    if (typeof claim.food === 'object' && claim.food?.type) {
      return claim.food.type;
    }
    return 'N/A';
  }

  getFoodQuantity(claim: any): string {
    if (typeof claim.food === 'object' && claim.food?.quantity) {
      return claim.food.quantity.toString();
    }
    return 'N/A';
  }

  getFoodLocation(claim: any): string {
    if (typeof claim.food === 'object' && claim.food?.pickupLocation) {
      return claim.food.pickupLocation;
    }
    return 'N/A';
  }

  getFoodExpiry(claim: any): string {
    if (typeof claim.food === 'object' && claim.food?.expirationDate) {
      return new Date(claim.food.expirationDate).toLocaleDateString();
    }
    return 'N/A';
  }
}

