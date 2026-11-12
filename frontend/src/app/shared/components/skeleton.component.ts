import { Component, Input } from '@angular/core';

/**
 * Shimmering placeholder shown while data loads.
 * variant "cards" draws a grid of card shapes, "stats" a row of stat tiles,
 * "table" a list of rows.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="sk" [class]="'sk sk-' + variant" role="status" aria-live="polite" aria-label="Loading">
      @switch (variant) {
        @case ('stats') {
          @for (i of items; track i) {
            <div class="sk-tile"><div class="sk-circle shimmer"></div><div class="sk-lines"><div class="sk-line w60 shimmer"></div><div class="sk-line w40 shimmer"></div></div></div>
          }
        }
        @case ('table') {
          @for (i of items; track i) {
            <div class="sk-row"><div class="sk-line w30 shimmer"></div><div class="sk-line w20 shimmer"></div><div class="sk-line w15 shimmer"></div></div>
          }
        }
        @default {
          @for (i of items; track i) {
            <div class="sk-card"><div class="sk-img shimmer"></div><div class="sk-line w70 shimmer"></div><div class="sk-line w50 shimmer"></div><div class="sk-line w30 shimmer"></div></div>
          }
        }
      }
      <span class="sr-only">Loading…</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .sk-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .sk-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .sk-table { display: flex; flex-direction: column; gap: 12px; }
    .sk-card, .sk-tile, .sk-row { background: var(--zp-surface); border-radius: 12px; box-shadow: var(--zp-shadow); }
    .sk-card { padding: 0 0 16px; overflow: hidden; display: flex; flex-direction: column; gap: 10px; }
    .sk-card .sk-line { margin: 0 16px; }
    .sk-img { height: 120px; }
    .sk-tile { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .sk-circle { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sk-row { display: flex; gap: 24px; padding: 16px 20px; }
    .sk-line { height: 12px; border-radius: 6px; }
    .w70 { width: 70%; } .w60 { width: 60%; } .w50 { width: 50%; } .w40 { width: 40%; }
    .w30 { width: 30%; } .w20 { width: 20%; } .w15 { width: 15%; }
    .shimmer {
      background: linear-gradient(90deg, var(--zp-surface-2) 25%, var(--zp-surface-3) 50%, var(--zp-surface-2) 75%);
      background-size: 200% 100%;
      animation: sk-shimmer 1.4s ease-in-out infinite;
    }
    @keyframes sk-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'cards' | 'stats' | 'table' = 'cards';
  @Input() set count(n: number) { this.items = Array.from({ length: n }, (_, i) => i); }
  items = [0, 1, 2, 3, 4, 5];
}
