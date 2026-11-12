import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { prefersReducedMotion } from '../utils/motion';

/**
 * Fades and slides an element in when it scrolls into view.
 * Usage: <div appReveal [revealDelay]="i * 80"></div>
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  @Input() revealFrom: 'up' | 'left' | 'right' | 'zoom' = 'up';

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.renderer.addClass(node, 'zp-reveal');
    this.renderer.addClass(node, `zp-reveal-${this.revealFrom}`);
    if (this.revealDelay) {
      this.renderer.setStyle(node, 'transition-delay', `${Math.min(this.revealDelay, 800)}ms`);
    }
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.renderer.addClass(node, 'zp-revealed');
          this.observer?.disconnect();
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
