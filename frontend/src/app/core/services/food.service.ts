import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FoodItem {
  _id?: string;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | Date;
  pickupLocation: string;
  status: 'available' | 'claimed' | 'picked_up' | 'expired';
  donor?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  location?: {
    type: string;
    coordinates: number[];
  };
}

export interface AddFoodRequest {
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | Date;
  pickupLocation: string;
  status?: 'available';
  location?: {
    type: string;
    coordinates: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = '/api/foods';

  constructor(private http: HttpClient) {}

  getAllFood(): Observable<{ food: FoodItem[] }> {
    return this.http.get<{ food: FoodItem[] }>(`${this.apiUrl}/`);
  }

  getAvailableFood(): Observable<{ food: FoodItem[] }> {
    return this.http.get<{ food: FoodItem[] }>(`${this.apiUrl}/available`);
  }

  addFoodItem(foodData: AddFoodRequest): Observable<{ success: boolean; message: string; food: FoodItem; recommendedNGOs?: any[] }> {
    return this.http.post<{ success: boolean; message: string; food: FoodItem; recommendedNGOs?: any[] }>(
      `${this.apiUrl}/add-foodItem`,
      foodData,
      { withCredentials: true }
    );
  }

  updateFoodItem(id: string, foodData: Partial<AddFoodRequest>): Observable<{ message: string; food: FoodItem }> {
    return this.http.patch<{ message: string; food: FoodItem }>(
      `${this.apiUrl}/update-foodItem/${id}`,
      foodData,
      { withCredentials: true }
    );
  }

  deleteFoodItem(id: string): Observable<{ message: string; food: FoodItem }> {
    return this.http.delete<{ message: string; food: FoodItem }>(
      `${this.apiUrl}/delete-foodItem/${id}`,
      { withCredentials: true }
    );
  }
}

