import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalyticsSummary {
  totalDonations: number;
  totalClaims: number;
  totalMealsSaved: number;
  activeDonors: number;
  activeReceivers: number;
}

export interface TopDonor {
  donorId: string;
  donor: {
    _id: string;
    name: string;
    email: string;
  };
  totalQuantity: number;
  donationsCount: number;
}

export interface FraudData {
  duplicateClaimsCount: number;
  duplicateClaims: any[];
  rapidClaimUsersCount: number;
  rapidClaimUsers: any[];
  suspiciousDonorsCount: number;
  suspiciousDonors: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = '/api/analytics';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<{ success: boolean; data: AnalyticsSummary; message: string }> {
    return this.http.get<{ success: boolean; data: AnalyticsSummary; message: string }>(
      `${this.apiUrl}/getAnalytics`,
      { withCredentials: true }
    );
  }

  getTopDonors(limit: number = 10): Observable<{ success: boolean; data: TopDonor[]; message: string }> {
    return this.http.get<{ success: boolean; data: TopDonor[]; message: string }>(
      `${this.apiUrl}/top-donors?limit=${limit}`,
      { withCredentials: true }
    );
  }

  getFrauds(recentMinutes: number = 60, rapidThreshold: number = 5): Observable<{ success: boolean; data: FraudData }> {
    return this.http.get<{ success: boolean; data: FraudData }>(
      `${this.apiUrl}/frauds?recentMinutes=${recentMinutes}&rapidThreshold=${rapidThreshold}`,
      { withCredentials: true }
    );
  }
}

