import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <p>Completing authentication...</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const userParam = params['user'];
      console.log('User param received:', userParam);
      
      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          console.log('Parsed user:', user);
          console.log('Is new user:', user.isNewUser);
          
          // Store user in auth service
          this.authService.setUser(user);
          
          this.snackBar.open('Google authentication successful!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          // If new user, redirect to role selection
          if (user.isNewUser) {
            console.log('Redirecting to role selection');
            this.router.navigate(['/auth/role-selection'], {
              queryParams: { userId: user._id, email: user.email, name: user.name }
            });
          } else {
            // Navigate to home for existing users
            console.log('Redirecting to home');
            this.router.navigate(['/home']);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.snackBar.open('Authentication failed. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/login']);
        }
      } else {
        this.snackBar.open('Authentication failed. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/login']);
      }
    });
  }
}

