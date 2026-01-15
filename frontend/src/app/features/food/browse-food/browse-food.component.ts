import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { FoodService, FoodItem } from '../../../core/services/food.service';
import { ClaimService } from '../../../core/services/claim.service';

interface DisplayFoodItem {
  id: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  description: string;
  location: string;
  contactPhone: string;
  pickupTime: string;
  donorName: string;
  postedDate: string;
  distance?: number;
  status?: string;
}

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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatMenuModule
  ],
  templateUrl: './browse-food.component.html',
  styleUrls: ['./browse-food.component.scss']
})

export class BrowseFoodComponent implements OnInit {
  currentUser: User | null = null;
  foodItems: DisplayFoodItem[] = [];
  filteredItems: DisplayFoodItem[] = [];
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedSort: string = 'newest';
  isLoading = false;

  categories = [
    'All Categories',
    'Fruits & Vegetables',
    'Bakery Items',
    'Dairy Products',
    'Prepared Meals',
    'Beverages',
    'Snacks',
    'Other'
  ];

  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'quantity', label: 'Highest Quantity' },
    { value: 'distance', label: 'Nearest First' }
  ];

  constructor(
    public authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private foodService: FoodService,
    private claimService: ClaimService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
    this.loadFoodItems();
  }

  loadFoodItems(): void {
    this.isLoading = true;
    this.foodService.getAvailableFood().subscribe({
      next: (response) => {
        this.foodItems = response.food.map((item: FoodItem) => this.mapFoodItem(item));
        this.filteredItems = [...this.foodItems];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading food items:', error);
        this.snackBar.open('Failed to load food items. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  private mapFoodItem(item: FoodItem): DisplayFoodItem {
    return {
      id: item._id || '',
      foodName: item.title,
      category: item.type || 'Other',
      quantity: item.quantity,
      unit: 'kg', // Default unit
      expiryDate: new Date(item.expirationDate).toLocaleDateString(),
      description: `${item.title} - Available for pickup at ${item.pickupLocation}`,
      location: item.pickupLocation,
      contactPhone: 'N/A', // Not in backend model
      pickupTime: 'Flexible', // Not in backend model
      donorName: item.donor?.name || 'Anonymous Donor',
      postedDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      distance: undefined,
      status: item.status
    };
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.foodItems];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.foodName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.donorName.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All Categories') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.selectedSort) {
        case 'newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'oldest':
          return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
        case 'quantity':
          return b.quantity - a.quantity;
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        default:
          return 0;
      }
    });

    this.filteredItems = filtered;
  }

  requestFood(item: DisplayFoodItem): void {
    if (!item.id) {
      this.snackBar.open('Invalid food item', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.claimService.createClaim(item.id).subscribe({
      next: (response) => {
        this.snackBar.open('Food claim created successfully!', 'Close', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        });
        // Reload food items to update status
        this.loadFoodItems();
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to claim food. Please try again.',
          'Close',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Fruits & Vegetables': 'bg-green-100 text-green-800',
      'Bakery Items': 'bg-amber-100 text-amber-800',
      'Dairy Products': 'bg-blue-100 text-blue-800',
      'Prepared Meals': 'bg-purple-100 text-purple-800',
      'Beverages': 'bg-cyan-100 text-cyan-800',
      'Snacks': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'donor': return 'bg-green-100 text-green-800';
      case 'receiver': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'donor': return 'Donor';
      case 'receiver': return 'Receiver';
      case 'admin': return 'Admin';
      default: return role;
    }
  }
}









