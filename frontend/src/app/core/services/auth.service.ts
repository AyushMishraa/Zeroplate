import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginCredentials, RegisterData, UserRole } from '../models';

/**
 * Session handling.
 *
 * Email/password login returns a JWT in the response body, which we keep in
 * localStorage and send as a Bearer header. Google OAuth only sets an httpOnly
 * `token` cookie on the API origin, so for those users there is no token in
 * storage and requests rely on the cookie (sent via `withCredentials`).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'zp_token';
  private readonly USER_KEY = 'zp_user';

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  role = computed<UserRole | null>(() => this.currentUser()?.role ?? null);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const userJson = this.safeGet(this.USER_KEY);
    if (!userJson) return;

    const token = this.getToken();
    if (token && this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    try {
      const user = JSON.parse(userJson) as User;
      if (user && user._id && user.role) {
        this.setCurrentUser(user);
      } else {
        this.clearSession();
      }
    } catch {
      this.clearSession();
    }
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return this.safeGet(this.TOKEN_KEY);
  }

  getRole(): UserRole | null {
    return this.role();
  }

  getUserId(): string | null {
    return this.currentUser()?._id ?? null;
  }

  // ---- API calls -----------------------------------------------------------

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.user) {
          const { token, ...user } = response.user;
          this.saveSession(user, token ?? null);
        }
      })
    );
  }

  /** The backend creates the account but does not log the user in. */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, {
      ...data,
      provider: 'local'
    });
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  /**
   * Called from /auth/google/callback. The backend redirects with the user as
   * JSON in the `user` query param; a `token` param is used when present.
   */
  handleGoogleCallback(user: User, token?: string | null): void {
    this.saveSession(user, token ?? null);
    if (user.isNewUser) {
      this.router.navigate(['/auth/select-role']);
    } else {
      this.redirectAfterLogin();
    }
  }

  updateRole(role: UserRole): Observable<AuthResponse> {
    const userId = this.getUserId();
    return this.http.put<AuthResponse>(`${environment.apiUrl}/auth/update-role`, { userId, role }).pipe(
      tap(response => {
        const current = this.currentUser();
        if (!current) return;
        const updated: User = { ...current, ...(response.user ?? {}), role, isNewUser: false };
        this.persistUser(updated);
        this.setCurrentUser(updated);
        // The old bearer token still carries the previous role. The backend
        // re-issues the cookie, so drop the stale token and rely on that.
        this.safeRemove(this.TOKEN_KEY);
      })
    );
  }

  // ---- Session ---------------------------------------------------------------

  private saveSession(user: User, token: string | null): void {
    if (token) {
      this.safeSet(this.TOKEN_KEY, token);
    } else {
      this.safeRemove(this.TOKEN_KEY);
    }
    this.persistUser(user);
    this.setCurrentUser(user);
  }

  private persistUser(user: User): void {
    this.safeSet(this.USER_KEY, JSON.stringify(user));
  }

  clearSession(): void {
    this.safeRemove(this.TOKEN_KEY);
    this.safeRemove(this.USER_KEY);
    this.setCurrentUser(null);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  homeRouteFor(role: UserRole | null): string {
    switch (role) {
      case 'donor': return '/donor/dashboard';
      case 'receiver': return '/receiver/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  }

  redirectAfterLogin(returnUrl?: string | null): void {
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    this.router.navigate([this.homeRouteFor(this.getRole())]);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private safeGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  private safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  }

  private safeRemove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  }
}
