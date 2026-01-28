import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'donor' | 'receiver' | 'admin';
  provider: 'google' | 'local';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: 'donor' | 'receiver' | 'admin';
  provider: 'local';
}

export interface AuthResponse {
  message: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(response => {
        if (response.user) {
          this.setUser(response.user);
          // Token is set in httpOnly cookie by backend, but we store user info
        }
      })
    );
  }

  signup(userData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, userData, { withCredentials: true }).pipe(
      tap(response => {
        // Backend may return user in response or we may need to login after signup
        // For now, if user is in response, store it
        if (response.user) {
          this.setUser(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    // Token is stored in httpOnly cookie by backend
    // For API calls, we rely on withCredentials: true
    return null; // Token is in httpOnly cookie
  }

  setUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateUserRole(userId: string, role: 'donor' | 'receiver'): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/update-role`, { userId, role }, { withCredentials: true }).pipe(
      tap(response => {
        if (response.user) {
          this.setUser(response.user);
        }
      })
    );
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }
}

