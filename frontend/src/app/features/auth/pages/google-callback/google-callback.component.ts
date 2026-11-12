import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models';

/**
 * The backend's /auth/google/callback sets an httpOnly cookie and redirects here
 * with `?user=<json>` (and optionally `&token=`). New Google users pick a role next.
 */
@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './google-callback.component.html',
  styleUrl: './google-callback.component.scss'
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const rawUser = params.get('user');
    const token = params.get('token');

    if (!rawUser) {
      this.fail();
      return;
    }

    try {
      // Angular already decodes query params; decode again only if still encoded.
      const json = rawUser.trim().startsWith('{') ? rawUser : decodeURIComponent(rawUser);
      const user = JSON.parse(json) as User;
      if (!user?._id || !user.email) {
        this.fail();
        return;
      }
      this.authService.handleGoogleCallback(user, token);
    } catch (error) {
      console.error('Failed to parse Google sign-in response:', error);
      this.fail();
    }
  }

  private fail(): void {
    this.router.navigate(['/auth/login'], { queryParams: { error: 'google' }, replaceUrl: true });
  }
}
