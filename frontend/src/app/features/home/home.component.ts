import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService, User } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
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
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  isDarkMode$ = this.themeService.isDarkMode$;
  stats = [
    { label: 'Food Saved', value: '1,234', icon: 'restaurant', color: 'text-green-600' },
    { label: 'Communities Fed', value: '567', icon: 'groups', color: 'text-blue-600' },
    { label: 'Active Donors', value: '89', icon: 'volunteer_activism', color: 'text-purple-600' },
    { label: 'NGOs Connected', value: '45', icon: 'handshake', color: 'text-pink-600' }
  ];

  features = [
    {
      title: 'List Surplus Food',
      description: 'Restaurants and supermarkets can easily list their surplus food items',
      icon: 'add_shopping_cart',
      color: 'bg-blue-500'
    },
    {
      title: 'Smart Matching',
      description: 'AI-powered matching connects donors with nearby NGOs and food banks',
      icon: 'psychology',
      color: 'bg-purple-500'
    },
    {
      title: 'Track Impact',
      description: 'Monitor your contribution to reducing food waste in real-time',
      icon: 'analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Community Network',
      description: 'Join a growing network of organizations fighting food waste',
      icon: 'people',
      color: 'bg-pink-500'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Restaurant Owner',
      organization: 'Green Bites Cafe',
      image: '👩‍🍳',
      text: 'ZeroPlate has transformed how we handle surplus food. We\'ve reduced waste by 80% and helped feed over 500 families in our community.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'NGO Director',
      organization: 'Community Food Bank',
      image: '👨‍💼',
      text: 'The platform makes it incredibly easy to connect with donors. We\'ve received fresh, quality food that directly benefits those in need.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Supermarket Manager',
      organization: 'FreshMart Stores',
      image: '👩‍💼',
      text: 'ZeroPlate is a game-changer! We can now redirect surplus inventory to those who need it most, creating a positive impact every day.',
      rating: 5
    },
    {
      name: 'David Thompson',
      role: 'Volunteer Coordinator',
      organization: 'Hope Foundation',
      image: '👨‍🎓',
      text: 'The real-time matching feature is brilliant. We can quickly find and collect food donations, ensuring nothing goes to waste.',
      rating: 5
    }
  ];

  currentRoute: string = '';

  constructor(
    public authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentRoute = this.router.url;
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  logout(): void {
    this.authService.logout();
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  // Check if user is authenticated, if not prompt for login/signup
  handleAction(action: string): void {
    if (!this.authService.isAuthenticated()) {
      this.promptAuth(action);
    } else {
      // User is authenticated, navigate to appropriate page
      if (action === 'list-food') {
        this.router.navigate(['/add-food']);
      } else if (action === 'browse-food') {
        this.router.navigate(['/browse-food']);
      } else {
        this.performAction(action);
      }
    }
  }

  promptAuth(action: string): void {
    const message = `Please ${action === 'signup' ? 'sign up' : 'log in'} to ${this.getActionDescription(action)}`;
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
    
    // Navigate to appropriate page
    setTimeout(() => {
      if (action === 'signup') {
        this.router.navigate(['/signup']);
      } else {
        this.router.navigate(['/login']);
      }
    }, 500);
  }

  getActionDescription(action: string): string {
    const descriptions: { [key: string]: string } = {
      'list-food': 'list your surplus food',
      'browse-food': 'browse available food',
      'get-started': 'get started',
      'track-impact': 'track your impact',
      'join-network': 'join our network'
    };
    return descriptions[action] || 'continue';
  }

  performAction(action: string): void {
    // Here you would implement the actual functionality
    // For now, just show a success message
    this.snackBar.open(`${this.getActionDescription(action)} feature coming soon!`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'donor':
        return 'bg-green-100 text-green-800';
      case 'receiver':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'donor':
        return 'Donor';
      case 'receiver':
        return 'Receiver';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }
}
