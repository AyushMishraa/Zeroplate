import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found">
      <img class="art" src="assets/illustrations/not-found.svg" alt="An empty plate with a question mark" />
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <a mat-raised-button color="primary" [routerLink]="home()">
        <mat-icon>home</mat-icon>
        {{ auth.isAuthenticated() ? 'Back to my dashboard' : 'Go to home page' }}
      </a>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 12px; padding: 96px 24px; min-height: 60vh;
    }
    .art { width: 280px; max-width: 80%; height: auto; animation: wobble 4s ease-in-out infinite; }
    @keyframes wobble { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg) translateY(-6px); } }
    @media (prefers-reduced-motion: reduce) { .art { animation: none; } }
    h1 { color: var(--zp-text); font-size: 2rem; }
    p { color: var(--zp-text-secondary); margin-bottom: 12px; }
  `]
})
export class NotFoundComponent {
  readonly home = computed(() => this.auth.homeRouteFor(this.auth.role()));
  constructor(public auth: AuthService) {}
}
