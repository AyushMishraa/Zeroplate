import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { donorGuard, receiverGuard, adminGuard } from './core/guards/role.guards';

export const routes: Routes = [
  // Landing page
  {
    path: '',
    pathMatch: 'full',
    title: 'ZeroPlate | Food Waste Redistribution',
    loadComponent: () => import('./features/auth/pages/landing/landing.component').then(m => m.LandingComponent)
  },

  // Auth routes
  {
    path: 'auth/login',
    title: 'Sign in | ZeroPlate',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    title: 'Create account | ZeroPlate',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/google/callback',
    title: 'Signing in | ZeroPlate',
    loadComponent: () => import('./features/auth/pages/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent)
  },
  {
    path: 'auth/select-role',
    title: 'Choose your role | ZeroPlate',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/pages/select-role/select-role.component').then(m => m.SelectRoleComponent)
  },
  // Old paths from the README
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'signup', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  // Donor routes
  {
    path: 'donor',
    canActivate: [authGuard, donorGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Donor dashboard | ZeroPlate',
        loadComponent: () => import('./features/donor/pages/dashboard/dashboard.component').then(m => m.DonorDashboardComponent)
      },
      {
        path: 'add-food',
        title: 'Add food | ZeroPlate',
        loadComponent: () => import('./features/donor/pages/add-food/add-food.component').then(m => m.AddFoodComponent)
      },
      {
        path: 'my-foods',
        title: 'My listings | ZeroPlate',
        loadComponent: () => import('./features/donor/pages/my-foods/my-foods.component').then(m => m.MyFoodsComponent)
      }
    ]
  },

  // Receiver routes
  {
    path: 'receiver',
    canActivate: [authGuard, receiverGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Receiver dashboard | ZeroPlate',
        loadComponent: () => import('./features/receiver/pages/dashboard/dashboard.component').then(m => m.ReceiverDashboardComponent)
      },
      {
        path: 'browse-food',
        title: 'Browse food | ZeroPlate',
        loadComponent: () => import('./features/receiver/pages/browse-food/browse-food.component').then(m => m.BrowseFoodComponent)
      },
      {
        path: 'my-claims',
        title: 'My claims | ZeroPlate',
        loadComponent: () => import('./features/receiver/pages/my-claims/my-claims.component').then(m => m.MyClaimsComponent)
      }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Admin dashboard | ZeroPlate',
        loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'analytics',
        title: 'Analytics | ZeroPlate',
        loadComponent: () => import('./features/admin/pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'fraud',
        title: 'Fraud detection | ZeroPlate',
        loadComponent: () => import('./features/admin/pages/fraud/fraud.component').then(m => m.FraudComponent)
      }
    ]
  },

  // 404
  {
    path: '**',
    title: 'Page not found | ZeroPlate',
    loadComponent: () => import('./shared/components/not-found.component').then(m => m.NotFoundComponent)
  }
];
