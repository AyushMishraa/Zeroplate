import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SocketService, Notification } from '../../core/services/socket.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserRole } from '../../core/models';
import { timeAgo } from '../utils/date.utils';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  donor: [
    { path: '/donor/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/donor/add-food', label: 'Add Food', icon: 'add_circle' },
    { path: '/donor/my-foods', label: 'My Foods', icon: 'restaurant_menu' }
  ],
  receiver: [
    { path: '/receiver/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/receiver/browse-food', label: 'Browse Food', icon: 'search' },
    { path: '/receiver/my-claims', label: 'My Claims', icon: 'shopping_basket' }
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/admin/fraud', label: 'Fraud Detection', icon: 'gpp_maybe' }
  ]
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly userRole = this.authService.role;
  readonly userName = computed(() => this.authService.currentUser()?.name || '');
  readonly userEmail = computed(() => this.authService.currentUser()?.email || '');
  readonly links = computed<NavLink[]>(() => {
    const role = this.userRole();
    return role ? NAV_LINKS[role] : [];
  });
  readonly homeLink = computed(() => this.isAuthenticated() ? this.authService.homeRouteFor(this.userRole()) : '/');

  readonly notifications = this.socketService.notifications;
  readonly unreadCount = this.socketService.unreadCount;
  readonly isDarkMode = this.themeService.isDarkMode;

  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private themeService: ThemeService,
    router: Router
  ) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileMenuOpen = false;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  onNotificationsOpened(): void {
    // Mark as read shortly after opening so the badge clears but items still show as new.
    setTimeout(() => this.socketService.markAllRead(), 1500);
  }

  clearNotifications(event: Event): void {
    event.stopPropagation();
    this.socketService.clearAll();
  }

  logout(): void {
    this.authService.logout();
  }

  getNotificationIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      claimCreated: 'shopping_basket',
      foodExpiring: 'warning',
      pickupReminder: 'event',
      foodClaimed: 'check_circle'
    };
    return icons[type] || 'notifications';
  }

  formatTime(date: Date): string {
    return timeAgo(date);
  }
}
