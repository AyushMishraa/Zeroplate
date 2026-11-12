import { Component, Input } from '@angular/core';

/** Illustrated empty state. Project actions into it with <ng-content>. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="es" [class.compact]="compact">
      <img [src]="'assets/illustrations/' + image + '.svg'" alt="" aria-hidden="true" class="es-img" />
      <h3>{{ title }}</h3>
      @if (message) { <p>{{ message }}</p> }
      <div class="es-actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [`
    .es { text-align: center; padding: 40px 16px; animation: es-in .5s ease both; }
    .es-img { width: 200px; max-width: 70%; height: auto; margin-bottom: 12px; }
    .compact { padding: 16px; }
    .compact .es-img { width: 120px; }
    h3 { color: var(--zp-text); margin: 0 0 8px; font-weight: 500; }
    p { color: var(--zp-text-secondary); margin: 0 0 16px; }
    .es-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    @keyframes es-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  `]
})
export class EmptyStateComponent {
  @Input() image: 'empty-plate' | 'empty-basket' | 'not-found' = 'empty-plate';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() compact = false;
}
