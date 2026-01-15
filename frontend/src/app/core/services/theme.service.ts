import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'zeroplate-theme';
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();

  constructor() {
    this.loadTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      this.isDarkModeSubject.next(isDark);
      this.applyTheme(isDark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkModeSubject.next(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  toggleTheme(): void {
    const currentMode = this.isDarkModeSubject.value;
    const newMode = !currentMode;
    this.isDarkModeSubject.next(newMode);
    this.applyTheme(newMode);
    localStorage.setItem(this.THEME_KEY, newMode ? 'dark' : 'light');
  }

  setTheme(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }

  private applyTheme(isDark: boolean): void {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark-mode');
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.classList.remove('dark-mode');
      htmlElement.setAttribute('data-theme', 'light');
    }
  }
}


