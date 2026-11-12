import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { prefersReducedMotion } from '../utils/motion';

/** Illustrated side panel used on the sign-in, sign-up and role pages. */
@Component({
  selector: 'app-auth-art',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <aside class="auth-art" aria-hidden="true">
      <div class="glow g1"></div>
      <div class="glow g2"></div>
      <img src="assets/illustrations/auth.svg" alt="" class="art" />
      <h2>Good food belongs on a plate.</h2>
      <div class="facts">
        @for (f of [facts[index()]]; track f.text) {
          <p class="fact"><mat-icon>{{ f.icon }}</mat-icon>{{ f.text }}</p>
        }
      </div>
      <div class="dots">
        @for (f of facts; track f.text; let i = $index) {
          <span [class.on]="i === index()"></span>
        }
      </div>
    </aside>
  `,
  styles: [`
    :host { display: contents; }
    .auth-art {
      position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; gap: 12px; padding: 40px 32px; color: #fff;
      background: linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04));
      border-radius: 16px 0 0 16px; backdrop-filter: blur(4px);
    }
    .glow { position: absolute; border-radius: 50%; filter: blur(40px); opacity: .5; animation: float 14s ease-in-out infinite alternate; }
    .g1 { width: 220px; height: 220px; background: #43e97b; top: -60px; left: -60px; }
    .g2 { width: 180px; height: 180px; background: #ff4081; bottom: -50px; right: -40px; animation-duration: 18s; }
    @keyframes float { to { transform: translate(40px, 30px) scale(1.1); } }
    .art { position: relative; width: 100%; max-width: 280px; height: auto; animation: rise .8s ease both; }
    h2 { position: relative; margin: 8px 0 0; font-size: 1.5rem; font-weight: 600; }
    .facts { position: relative; min-height: 48px; }
    .fact { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0; opacity: .92; animation: rise .5s ease both; }
    .fact mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .dots { display: flex; gap: 6px; position: relative; }
    .dots span { width: 6px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.4); transition: all .3s ease; }
    .dots span.on { width: 18px; background: #fff; }
    @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @media (max-width: 860px) { .auth-art { display: none; } }
  `]
})
export class AuthArtComponent implements OnInit, OnDestroy {
  readonly facts = [
    { icon: 'schedule', text: 'List surplus food in under a minute.' },
    { icon: 'place', text: 'Nearby NGOs are matched automatically.' },
    { icon: 'notifications_active', text: 'Get notified the moment food is claimed.' },
    { icon: 'eco', text: 'Every rescued meal avoids CO₂ emissions.' }
  ];
  readonly index = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (!prefersReducedMotion()) {
      this.timer = setInterval(() => this.index.update(i => (i + 1) % this.facts.length), 3500);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
