import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { FoodItem, FoodStatus } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/dialogs/confirm-dialog.component';
import { EditFoodDialogComponent } from '../../../../shared/dialogs/edit-food-dialog.component';
import { expiresLabel, isExpired, isUrgent, timeAgo } from '../../../../shared/utils/date.utils';
import { foodImage } from '../../../../shared/utils/food-image';
import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

type StatusFilter = 'all' | FoodStatus;
type SortOrder = 'newest' | 'expiry' | 'quantity';

const STATUS_FILTERS: StatusFilter[] = ['all', 'available', 'claimed', 'picked_up', 'expired'];

// ---- Main Component ----
@Component({
  selector: 'app-my-foods',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SkeletonComponent,
    EmptyStateComponent,
    RevealDirective
  ],
  templateUrl: './my-foods.component.html',
  styleUrl: './my-foods.component.scss'
})
export class MyFoodsComponent implements OnInit {
  readonly statusFilters = STATUS_FILTERS;
  readonly foodImage = foodImage;
  isLoading = true;
  loadError = false;
  busyId: string | null = null;

  allFoods: FoodItem[] = [];
  filteredFoods: FoodItem[] = [];
  selectedFilter: StatusFilter = 'all';
  searchQuery = '';
  sortOrder: SortOrder = 'newest';

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private dialog: MatDialog,
    private notify: NotifyService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const status = this.route.snapshot.queryParamMap.get('status') as StatusFilter | null;
    if (status && STATUS_FILTERS.includes(status)) {
      this.selectedFilter = status;
    }
    this.loadMyFoods();
  }

  loadMyFoods(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.loadError = false;
    this.foodService.getMyFoods(userId).subscribe({
      next: (foods) => {
        this.allFoods = foods;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load your listings.');
      }
    });
  }

  filterBy(status: StatusFilter): void {
    this.selectedFilter = status;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'all' ? null : status },
      replaceUrl: true
    });
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.selectedFilter === 'all'
      ? [...this.allFoods]
      : this.allFoods.filter(food => food.status === this.selectedFilter);

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(f =>
        f.title.toLowerCase().includes(q) ||
        (f.type ?? '').toLowerCase().includes(q) ||
        (f.pickupLocation ?? '').toLowerCase().includes(q)
      );
    }

    switch (this.sortOrder) {
      case 'expiry':
        list.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        break;
      case 'quantity':
        list.sort((a, b) => b.quantity - a.quantity);
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    this.filteredFoods = list;
  }

  getFoodCountByStatus(status: StatusFilter): number {
    if (status === 'all') return this.allFoods.length;
    return this.allFoods.filter(food => food.status === status).length;
  }

  statusLabel(status: StatusFilter): string {
    switch (status) {
      case 'all': return 'All';
      case 'picked_up': return 'Picked up';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  expiresText(food: FoodItem): string {
    return expiresLabel(food.expirationDate);
  }

  listedText(food: FoodItem): string {
    return timeAgo(food.createdAt);
  }

  isUrgent(food: FoodItem): boolean {
    return food.status === 'available' && isUrgent(food.expirationDate);
  }

  isPastExpiry(food: FoodItem): boolean {
    return food.status === 'available' && isExpired(food.expirationDate);
  }

  editFood(food: FoodItem): void {
    this.dialog.open(EditFoodDialogComponent, { data: food, autoFocus: 'first-tabbable', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter((updated): updated is FoodItem => !!updated))
      .subscribe(updated => this.replace(updated));
  }

  setStatus(food: FoodItem, status: FoodStatus): void {
    const labels: Record<FoodStatus, string> = {
      available: 'available again',
      claimed: 'claimed',
      picked_up: 'picked up',
      expired: 'expired'
    };
    this.busyId = food._id;
    this.foodService.updateFood(food._id, { status }).subscribe({
      next: () => {
        this.busyId = null;
        this.replace({ ...food, status });
        this.notify.success(`"${food.title}" marked as ${labels[status]}`);
      },
      error: (error) => {
        this.busyId = null;
        this.notify.error(error, 'Could not update the listing.');
      }
    });
  }

  deleteFood(food: FoodItem): void {
    const data: ConfirmDialogData = {
      title: 'Delete listing?',
      message: `"${food.title}" will be removed permanently. Receivers will no longer see it.`,
      confirmText: 'Delete',
      icon: 'delete',
      danger: true
    };

    this.dialog.open(ConfirmDialogComponent, { data, width: '420px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.busyId = food._id;
          return this.foodService.deleteFood(food._id);
        })
      )
      .subscribe({
        next: () => {
          this.busyId = null;
          this.allFoods = this.allFoods.filter(f => f._id !== food._id);
          this.applyFilter();
          this.notify.success('Listing deleted');
        },
        error: (error) => {
          this.busyId = null;
          this.notify.error(error, 'Failed to delete the listing.');
        }
      });
  }

  private replace(updated: FoodItem): void {
    this.allFoods = this.allFoods.map(f => (f._id === updated._id ? { ...f, ...updated } : f));
    this.applyFilter();
  }
}
