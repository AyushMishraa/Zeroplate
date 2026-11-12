import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { prefersReducedMotion } from '../utils/motion';

/** Subtle 3D tilt that follows the pointer. Usage: <mat-card appTilt>. */
@Directive({
  selector: '[appTilt]',
  standalone: true
})
export class TiltDirective {
  @Input() tiltMax = 6;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(800px) rotateX(${(-y * this.tiltMax).toFixed(2)}deg) rotateY(${(x * this.tiltMax).toFixed(2)}deg) translateY(-4px)`
    );
  }

  @HostListener('pointerleave')
  onLeave(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'transform');
  }
}
