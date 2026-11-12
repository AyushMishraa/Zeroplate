import { Directive, ElementRef, Input, OnChanges, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from '../utils/motion';

/**
 * Animates a number from its previous value to the new one.
 * Usage: <span [appCountUp]="stats.total" [countSuffix]="'kg'"></span>
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') value: number | null | undefined = 0;
  @Input() countDuration = 1200;
  @Input() countDecimals = 0;
  @Input() countSuffix = '';

  private current = 0;
  private frame?: number;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    const target = Number(this.value) || 0;
    if (this.frame) cancelAnimationFrame(this.frame);

    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      this.render(target);
      return;
    }

    const from = this.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / this.countDuration);
      const eased = 1 - Math.pow(1 - p, 3);
      this.render(from + (target - from) * eased);
      if (p < 1) {
        this.frame = requestAnimationFrame(tick);
      } else {
        this.render(target);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  private render(n: number): void {
    this.current = n;
    const text = n.toLocaleString(undefined, {
      minimumFractionDigits: this.countDecimals,
      maximumFractionDigits: this.countDecimals
    });
    this.el.nativeElement.textContent = text + this.countSuffix;
  }
}
