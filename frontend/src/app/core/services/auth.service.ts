import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'zp_token';
  private readonly USER_KEY = 'zp_user';
  
  // Using Angular signals for reactive state management
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  
  // Backward compatible BehaviorSubject
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.setCurrentUser(user);
      } catch (error) {
        this.clearSession();
      }
    }
  }

  private setCurrentUser(user: User): void {
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return this.currentUser()?.role || null;
  }

  getUserId(): string | null {
    return this.currentUser()?._id || null;
  }

  // Authentication API calls
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.user && response.user.token) {
            this.saveSession(response.user.token, response.user);
          }
        })
      );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, {
      ...data,
      provider: 'local'
    }).pipe(
      tap(response => {
        if (response.user && response.user.token) {
          this.saveSession(response.user.token, response.user);
        }
      })
    );
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  handleGoogleCallback(user: User, token: string): void {
    this.saveSession(token, user);
    this.redirectAfterLogin();
  }

  updateRole(role: 'donor' | 'receiver' | 'admin'): Observable<any> {
    return this.http.put(`${environment.apiUrl}/auth/update-role`, { role })
      .pipe(
        tap(() => {
          const user = this.currentUser();
          if (user) {
            const updatedUser = { ...user, role };
            this.setCurrentUser(updatedUser);
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          }
        })
      );
  }

  private saveSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.setCurrentUser(user);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  redirectAfterLogin(): void {
    const role = this.getRole();
    const routes: Record<string, string> = {
      'donor': '/donor/dashboard',
      'receiver': '/receiver/dashboard',
      'admin': '/admin/dashboard'
    };
    this.router.navigate([routes[role as string] || '/']);
  }
}
