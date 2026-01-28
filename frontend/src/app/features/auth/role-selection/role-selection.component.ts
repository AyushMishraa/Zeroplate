import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './role-selection.component.html',
  styleUrls: ['./role-selection.component.scss']
})
export class RoleSelectionComponent implements OnInit {
  selectedRole: 'donor' | 'receiver' | null = null;
  isLoading = false;
  userId: string = '';
  email: string = '';
  name: string = '';

 roles: {
  value: 'donor' | 'receiver';
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: 'donor',
    label: 'Food Donor',
    icon: 'volunteer_activism',
    description: 'Share surplus food with communities and reduce waste'
  },
  {
    value: 'receiver',
    label: 'Food Receiver',
    icon: 'people',
    description: 'Receive food from donors and help those in need'
  }
];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'];
      this.email = params['email'];
      this.name = params['name'];

      if (!this.userId) {
        this.router.navigate(['/login']);
      }
    });
  }

  selectRole(role: 'donor' | 'receiver'): void {
    this.selectedRole = role;
  }

  confirmRole(): void {
    if (!this.selectedRole) {
      this.snackBar.open('Please select a role', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.authService.updateUserRole(this.userId, this.selectedRole).subscribe({
      next: (response) => {
        this.snackBar.open('Role selected successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Update the stored user with the new role
        const user = this.authService.getUser();
        if (user) {
          user.role = this.selectedRole as 'donor' | 'receiver' | 'admin';
          this.authService.setUser(user);
        }
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.snackBar.open('Failed to update role. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }
}
