import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Circular progress toward a goal, with +/- controls to change the goal.
 * The stroke animates whenever the value or goal changes.
 */
@Component({
  selector: 'app-goal-ring',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="goal" [class.reached]="pct >= 100">
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120" class="ring" role="img" [attr.aria-label]="value + ' of ' + goal + ' ' + unit">
          <defs>
            <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#43e97b" />
              <stop offset="1" stop-color="#38b2ac" />
            </linearGradient>
          </defs>
          <circle class="track" cx="60" cy="60" [attr.r]="radius" />
          <circle class="bar" cx="60" cy="60" [attr.r]="radius"
            [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="offset" />
        </svg>
        <div class="center">
          @if (pct >= 100) {
            <mat-icon class="trophy">emoji_events</mat-icon>
          }
          <strong>{{ pct }}%</strong>
          <span>{{ value }} / {{ goal }}</span>
        </div>
      </div>
      <div class="controls">
        <div class="label">{{ label }}</div>
        <div class="stepper">
          <button mat-icon-button (click)="change(-step)" [disabled]="goal <= step" aria-label="Lower goal" matTooltip="Lower goal"><mat-icon>remove</mat-icon></button>
          <span class="goal-val">{{ goal }} {{ unit }}</span>
          <button mat-icon-button (click)="change(step)" aria-label="Raise goal" matTooltip="Raise goal"><mat-icon>add</mat-icon></button>
        </div>
        <p class="hint">
          @if (pct >= 100) { Goal reached. Time to aim higher? }
          @else { {{ goal - value }} {{ unit }} to go this month. }
        </p>
      </div>
    </div>
  `,
  styles: [`
    .goal { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .ring-wrap { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
    .ring { width: 100%; height: 100%; transform: rotate(-90deg); }
    .track { fill: none; stroke: var(--zp-surface-3); stroke-width: 12; }
    .bar { fill: none; stroke: url(#goalGrad); stroke-width: 12; stroke-linecap: round;
      transition: stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1); }
    .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .center strong { font-size: 1.6rem; color: var(--zp-text); }
    .center span { font-size: .8rem; color: var(--zp-text-secondary); }
    .trophy { color: #ffb300; animation: pop .6s cubic-bezier(.2,1.6,.4,1) both; }
    .reached .ring-wrap { animation: glow 2s ease-in-out infinite; border-radius: 50%; }
    .controls { flex: 1; min-width: 180px; }
    .label { font-weight: 500; color: var(--zp-text); }
    .stepper { display: flex; align-items: center; gap: 4px; margin: 4px 0; }
    .goal-val { min-width: 90px; text-align: center; font-weight: 600; color: var(--zp-text); }
    .hint { margin: 0; color: var(--zp-text-secondary); font-size: .875rem; }
    @keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 0 0 rgba(67,233,123,.35); } 50% { box-shadow: 0 0 0 12px rgba(67,233,123,0); } }
  `]
})
export class GoalRingComponent implements OnChanges {
  @Input() value = 0;
  @Input() goal = 100;
  @Input() step = 10;
  @Input() unit = 'meals';
  @Input() label = 'Monthly goal';
  @Output() goalChange = new EventEmitter<number>();

  readonly radius = RADIUS;
  readonly circ = CIRC;
  pct = 0;
  offset = CIRC;

  ngOnChanges(): void {
    this.pct = this.goal > 0 ? Math.round((this.value / this.goal) * 100) : 0;
    // Start from empty, then animate to the value on the next frame.
    const target = CIRC * (1 - Math.min(1, this.pct / 100));
    requestAnimationFrame(() => (this.offset = target));
  }

  change(delta: number): void {
    const next = Math.max(this.step, this.goal + delta);
    this.goalChange.emit(next);
  }
}
