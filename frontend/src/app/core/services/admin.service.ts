import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalUsers: number;
  totalFoodItems: number;
  totalClaims: number;
  pendingPickups: number;
  foodByType: Array<{ _id: string; count: number }>;
}

export interface PendingPickup {
  _id: string;
  food: any;
  receiver: any;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<{ success: boolean; stats: DashboardStats }> {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(
      `${this.apiUrl}/adminDashboard`,
      { withCredentials: true }
    );
  }

  getPendingPickups(): Observable<{ success: boolean; totalClaimedFood: number }> {
    return this.http.get<{ success: boolean; totalClaimedFood: number }>(
      `${this.apiUrl}/pendingPickups`,
      { withCredentials: true }
    );
  }
}

