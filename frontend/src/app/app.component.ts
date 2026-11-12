import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from './shared/components/navbar.component';
import { ThemeService } from './core/services/theme.service';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ZeroPlate - Food Waste Reduction Platform';
  readonly year = new Date().getFullYear();
  readonly routeKey = signal('');

  @ViewChild('outletWrap') outletWrap?: ElementRef<HTMLElement>;

  // Injected here so the theme is applied and the socket follows the session from startup.
  constructor(_theme: ThemeService, _socket: SocketService) {
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(e => {
      const path = e.urlAfterRedirects.split('?')[0];
      if (path === this.routeKey()) return;
      this.routeKey.set(path);
      // Restart the CSS enter animation on each page change.
      const el = this.outletWrap?.nativeElement;
      if (el) {
        el.classList.remove('route-anim');
        void el.offsetWidth;
        el.classList.add('route-anim');
      }
    });
  }
}
