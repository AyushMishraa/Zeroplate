import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FoodItem, FoodResponse, CreateFoodData, UpdateFoodData, refId } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = `${environment.apiUrl}/foods`;

  constructor(private http: HttpClient) {}

  /** All listings, donor populated with name/email. */
  getAllFoods(): Observable<FoodItem[]> {
    return this.http.get<FoodResponse>(this.apiUrl).pipe(map(r => this.toList(r)));
  }

  /** Listings with status "available". */
  getAvailableFoods(): Observable<FoodItem[]> {
    return this.http.get<FoodResponse>(`${this.apiUrl}/available`).pipe(map(r => this.toList(r)));
  }

  /** The backend has no per-donor endpoint, so filter the full list. */
  getMyFoods(userId: string): Observable<FoodItem[]> {
    return this.getAllFoods().pipe(map(foods => foods.filter(f => refId(f.donor) === userId)));
  }

  createFood(foodData: CreateFoodData): Observable<FoodResponse> {
    return this.http.post<FoodResponse>(`${this.apiUrl}/add-foodItem`, foodData);
  }

  updateFood(foodId: string, updates: UpdateFoodData): Observable<FoodResponse> {
    return this.http.patch<FoodResponse>(`${this.apiUrl}/update-foodItem/${foodId}`, updates);
  }

  deleteFood(foodId: string): Observable<FoodResponse> {
    return this.http.delete<FoodResponse>(`${this.apiUrl}/delete-foodItem/${foodId}`);
  }

  private toList(response: FoodResponse): FoodItem[] {
    return Array.isArray(response?.food) ? response.food : [];
  }
}
