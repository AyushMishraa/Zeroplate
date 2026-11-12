import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsSummary, TopDonor, FraudData, ApiResponse, FoodItem } from '../models';
import { FoodService } from './food.service';

const EMPTY_FRAUD: FraudData = {
  duplicateClaimsCount: 0,
  duplicateClaims: [],
  rapidClaimUsersCount: 0,
  rapidClaimUsers: [],
  suspiciousDonorsCount: 0,
  suspiciousDonors: []
};

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient, private foodService: FoodService) {}

  /**
   * Summary from the backend. The backend counts "active donors" by grouping
   * the users collection on a field it doesn't have, so we count distinct
   * donors from the listings instead.
   */
  getAnalyticsSummary(): Observable<AnalyticsSummary> {
    return forkJoin({
      summary: this.http.get<ApiResponse<AnalyticsSummary>>(`${this.apiUrl}/getAnalytics`).pipe(map(r => r?.data)),
      foods: this.foodService.getAllFoods().pipe(catchError(() => of([] as FoodItem[])))
    }).pipe(
      map(({ summary, foods }) => {
        const donors = new Set(foods.map(f => (typeof f.donor === 'string' ? f.donor : f.donor?._id)).filter(Boolean));
        return {
          totalDonations: summary?.totalDonations ?? foods.length,
          totalClaims: summary?.totalClaims ?? 0,
          totalMealsSaved: summary?.totalMealsSaved ?? 0,
          activeDonors: foods.length ? donors.size : (summary?.activeDonors ?? 0),
          activeReceivers: summary?.activeReceivers ?? 0
        };
      })
    );
  }

  /**
   * Top donors by servings. Falls back to computing from the listings when the
   * backend aggregation returns nothing (it currently aggregates the wrong collection).
   */
  getTopDonors(limit = 10): Observable<TopDonor[]> {
    return this.http.get<ApiResponse<TopDonor[]>>(`${this.apiUrl}/top-donors?limit=${limit}`).pipe(
      map(r => (Array.isArray(r?.data) ? r.data : [])),
      catchError(() => of([] as TopDonor[])),
      switchMap(list => (list.length ? of(list) : this.topDonorsFromFoods(limit)))
    );
  }

  getFraudData(recentMinutes = 60, rapidThreshold = 5): Observable<FraudData> {
    return this.http.get<ApiResponse<FraudData>>(
      `${this.apiUrl}/frauds?recentMinutes=${recentMinutes}&rapidThreshold=${rapidThreshold}`
    ).pipe(map(r => ({ ...EMPTY_FRAUD, ...(r?.data ?? {}) })));
  }

  private topDonorsFromFoods(limit: number): Observable<TopDonor[]> {
    return this.foodService.getAllFoods().pipe(
      map(foods => {
        const byDonor = new Map<string, TopDonor>();
        for (const food of foods) {
          if (!food.donor || typeof food.donor === 'string') continue;
          const entry = byDonor.get(food.donor._id) ?? {
            donorId: food.donor._id,
            donor: food.donor,
            totalQuantity: 0,
            donationsCount: 0
          };
          entry.totalQuantity += food.quantity || 0;
          entry.donationsCount += 1;
          byDonor.set(food.donor._id, entry);
        }
        return [...byDonor.values()].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, limit);
      }),
      catchError(() => of([] as TopDonor[]))
    );
  }
}
