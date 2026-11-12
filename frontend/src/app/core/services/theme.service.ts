import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/** Light/dark theme. Persists to localStorage and follows the OS setting until the user picks one. */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'zp_theme';

  readonly isDarkMode = signal<boolean>(this.initialTheme());
  readonly isDarkMode$ = toObservable(this.isDarkMode);

  constructor() {
    this.apply(this.isDarkMode());
    document.documentElement.classList.remove('dark-theme-preload');

    // Follow OS changes only while the user hasn't chosen explicitly.
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!this.savedPreference()) {
          this.isDarkMode.set(e.matches);
          this.apply(e.matches);
        }
      });
    } catch { /* matchMedia unavailable */ }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    this.apply(isDark);
    try { localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light'); } catch { /* ignore */ }
  }

  getCurrentTheme(): 'dark' | 'light' {
    return this.isDarkMode() ? 'dark' : 'light';
  }

  private apply(isDark: boolean): void {
    document.body.classList.toggle('dark-theme', isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#1e1e1e' : '#667eea');
  }

  private savedPreference(): string | null {
    try { return localStorage.getItem(this.STORAGE_KEY); } catch { return null; }
  }

  private initialTheme(): boolean {
    const saved = this.savedPreference();
    if (saved) return saved === 'dark';
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }
}
