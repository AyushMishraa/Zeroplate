import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { HomeComponent } from './features/home/home.component';
import { GoogleCallbackComponent } from './features/auth/google-callback/google-callback.component';
import { RoleSelectionComponent } from './features/auth/role-selection/role-selection.component';
import { AddFoodComponent } from './features/food/add-food/add-food.component';
import { BrowseFoodComponent } from './features/food/browse-food/browse-food.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { VolunteerDashboardComponent } from './features/volunteer/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile/profile.component';
import { ClaimsListComponent } from './features/claims/claims-list/claims-list.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'auth/google/callback', component: GoogleCallbackComponent },
  { path: 'auth/role-selection', component: RoleSelectionComponent },
  { path: 'home', component: HomeComponent }, // Public home page
  { path: 'add-food', component: AddFoodComponent, canActivate: [authGuard] },
  { path: 'browse-food', component: BrowseFoodComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'claims', component: ClaimsListComponent, canActivate: [authGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'volunteer/dashboard', component: VolunteerDashboardComponent, canActivate: [roleGuard(['volunteer'])] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/home' }
];


