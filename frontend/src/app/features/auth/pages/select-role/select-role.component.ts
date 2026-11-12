import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { UserRole } from '../../../../core/models';

/** Shown to first-time Google users so they can choose donor or receiver. */
import { AuthArtComponent } from '../../../../shared/components/auth-art.component';

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, AuthArtComponent],
  templateUrl: './select-role.component.html',
  styleUrl: './select-role.component.scss'
})
export class SelectRoleComponent {
  selected: Extract<UserRole, 'donor' | 'receiver'> | null = null;
  isSaving = false;
  readonly userName = this.authService.currentUser()?.name ?? '';

  constructor(private authService: AuthService, private notify: NotifyService) {
    const current = this.authService.getRole();
    if (current === 'donor' || current === 'receiver') {
      this.selected = current;
    }
  }

  select(role: Extract<UserRole, 'donor' | 'receiver'>): void {
    this.selected = role;
  }

  confirm(): void {
    if (!this.selected) return;
    this.isSaving = true;
    this.authService.updateRole(this.selected).subscribe({
      next: () => {
        this.isSaving = false;
        this.notify.success('You are all set!');
        this.authService.redirectAfterLogin();
      },
      error: (error) => {
        this.isSaving = false;
        this.notify.error(error, 'Could not save your role. Please try again.');
      }
    });
  }
}
