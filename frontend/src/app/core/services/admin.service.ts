import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, PendingPickup, UserRole } from '../models';

interface DashboardStatsResponse {
  success: boolean;
  stats?: Partial<DashboardStats>;
}

interface PendingPickupsResponse {
  success: boolean;
  pendingClaims: PendingPickup[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStatsResponse>(`${this.apiUrl}/adminDashboard`).pipe(
      map(r => ({
        totalUsers: 0,
        totalFoodItems: 0,
        totalClaims: 0,
        pendingPickups: 0,
        successfulPickups: 0,
        expiredFood: 0,
        foodByType: [],
        donationsPerDay: [],
        ...(r?.stats ?? {})
      }))
    );
  }

  getPendingPickups(): Observable<PendingPickup[]> {
    return this.http.get<PendingPickupsResponse>(`${this.apiUrl}/pendingPickups`).pipe(
      map(r => (Array.isArray(r?.pendingClaims) ? r.pendingClaims : []))
    );
  }

  updateUserRole(userId: string, role: UserRole): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/role/${userId}`, { role });
  }
}
