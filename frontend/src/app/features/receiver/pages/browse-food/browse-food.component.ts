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
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SkeletonComponent } from '../../../../shared/components/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { foodImage } from '../../../../shared/utils/food-image';
import { confettiBurst } from '../../../../shared/utils/confetti';
import { filter } from 'rxjs';
import { FoodService } from '../../../../core/services/food.service';
import { ClaimService } from '../../../../core/services/claim.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { FoodItem } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/dialogs/confirm-dialog.component';
import { FOOD_TYPES } from '../../../../shared/utils/food.constants';
import { expiresLabel, isExpired, isUrgent } from '../../../../shared/utils/date.utils';

type SortOrder = 'expiry' | 'newest' | 'quantity';
type ViewMode = 'grid' | 'list';
const VIEW_KEY = 'zp_browse_view';

@Component({
  selector: 'app-browse-food',
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
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSliderModule,
    MatButtonToggleModule,
    SkeletonComponent,
    EmptyStateComponent,
    RevealDirective
  ],
  templateUrl: './browse-food.component.html',
  styleUrls: ['./browse-food.component.scss']
})
export class BrowseFoodComponent implements OnInit {
  isLoading = true;
  loadError = false;
  isClaimingFood: string | null = null;
  allFoods: FoodItem[] = [];
  filteredFoods: FoodItem[] = [];
  availableTypes: string[] = [];
  searchQuery = '';
  selectedType = 'all';
  sortOrder: SortOrder = 'expiry';
  urgentOnly = false;
  typeOptions: string[] = [];
  minServings = 0;
  maxServings = 50;
  viewMode: ViewMode = this.loadView();
  leavingId: string | null = null;
  readonly foodImage = foodImage;

  constructor(
    private foodService: FoodService,
    private claimService: ClaimService,
    private dialog: MatDialog,
    private notify: NotifyService
  ) { }

  ngOnInit(): void {
    this.loadAvailableFoods();
  }

  loadAvailableFoods(): void {
    this.isLoading = true;
    this.loadError = false;
    this.foodService.getAvailableFoods().subscribe({
      next: (foods) => {
        // Hide listings whose expiry has passed but haven't been marked expired yet.
        this.allFoods = foods.filter(f => !isExpired(f.expirationDate));
        this.typeOptions = this.collectTypes(this.allFoods);
        this.maxServings = Math.max(10, ...this.allFoods.map(f => f.quantity || 0));
        this.minServings = Math.min(this.minServings, this.maxServings);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = true;
        this.notify.error(error, 'Failed to load available food.');
      }
    });
  }

  /** Known categories first, then any custom types donors used. */
  private collectTypes(foods: FoodItem[]): string[] {
    const present = new Set(foods.map(f => (f.type ?? '').trim()).filter(Boolean));
    const known = FOOD_TYPES.filter(t => [...present].some(p => p.toLowerCase() === t.toLowerCase()));
    const custom = [...present].filter(p => !FOOD_TYPES.some(t => t.toLowerCase() === p.toLowerCase()));
    return [...known, ...custom.sort()];
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allFoods];

    if (this.selectedType !== 'all') {
      const t = this.selectedType.toLowerCase();
      filtered = filtered.filter(food => (food.type ?? '').toLowerCase() === t);
    }

    if (this.minServings > 0) {
      filtered = filtered.filter(food => (food.quantity || 0) >= this.minServings);
    }

    if (this.urgentOnly) {
      filtered = filtered.filter(food => isUrgent(food.expirationDate));
    }

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(food =>
        food.title.toLowerCase().includes(query) ||
        (food.type ?? '').toLowerCase().includes(query) ||
        (food.pickupLocation ?? '').toLowerCase().includes(query) ||
        this.getDonorName(food).toLowerCase().includes(query)
      );
    }

    switch (this.sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'quantity':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
      default:
        filtered.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
    }

    this.filteredFoods = filtered;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery.trim() || this.selectedType !== 'all' || this.urgentOnly || this.minServings > 0;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = 'all';
    this.urgentOnly = false;
    this.minServings = 0;
    this.applyFilters();
  }

  setView(mode: ViewMode): void {
    this.viewMode = mode;
    try { localStorage.setItem(VIEW_KEY, mode); } catch { /* ignore */ }
  }

  private loadView(): ViewMode {
    try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
  }

  claimFood(food: FoodItem, event?: MouseEvent): void {
    const origin = event ? { x: event.clientX, y: event.clientY } : undefined;
    const data: ConfirmDialogData = {
      title: 'Claim this food?',
      message: `You're claiming ${food.quantity} servings of "${food.title}" from ${this.getDonorName(food)}. ` +
        `Please collect it from ${food.pickupLocation} before it expires ${expiresLabel(food.expirationDate)}.`,
      confirmText: 'Claim',
      icon: 'shopping_basket'
    };

    this.dialog.open(ConfirmDialogComponent, { data, width: '440px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.doClaim(food, origin));
  }

  private doClaim(food: FoodItem, origin?: { x: number; y: number }): void {
    this.isClaimingFood = food._id;

    this.claimService.createClaim(food._id).subscribe({
      next: () => {
        this.isClaimingFood = null;
        this.notify.success(`Claimed "${food.title}". Find it under My Claims.`);
        confettiBurst(origin);
        // Let the card animate out before it leaves the list.
        this.leavingId = food._id;
        setTimeout(() => {
          this.leavingId = null;
          this.allFoods = this.allFoods.filter(f => f._id !== food._id);
          this.applyFilters();
        }, 350);
      },
      error: (error) => {
        this.isClaimingFood = null;
        this.notify.error(error, 'Failed to claim this food.');
        // It may have been claimed by someone else in the meantime.
        if (error?.status === 404 || error?.status === 400) {
          this.loadAvailableFoods();
        }
      }
    });
  }

  formatDate(date: Date | string): string {
    return expiresLabel(date);
  }

  getDonorName(food: FoodItem): string {
    return typeof food.donor === 'object' && food.donor ? food.donor.name : 'Unknown donor';
  }

  isUrgent(food: FoodItem): boolean {
    return isUrgent(food.expirationDate);
  }

  getUrgencyText(food: FoodItem): string {
    return this.isUrgent(food) ? 'Urgent' : 'Available';
  }

  mapsLink(food: FoodItem): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.pickupLocation)}`;
  }
}
