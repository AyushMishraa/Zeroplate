import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Claim {
  _id?: string;
  food: string | any;
  receiver: string | any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private apiUrl = '/api/claims';

  constructor(private http: HttpClient) {}

  createClaim(foodId: string): Observable<{ message: string; claim: Claim }> {
    return this.http.post<{ message: string; claim: Claim }>(
      `${this.apiUrl}/`,
      { foodId },
      { withCredentials: true }
    );
  }

  getClaims(): Observable<{ success: boolean; claims: Claim[] }> {
    return this.http.get<{ success: boolean; claims: Claim[] }>(
      `${this.apiUrl}/`,
      { withCredentials: true }
    );
  }

  getAllClaims(): Observable<{ success: boolean; claims: Claim[] }> {
    // This might need to be implemented in backend for admin
    return this.http.get<{ success: boolean; claims: Claim[] }>(
      `${this.apiUrl}/all`,
      { withCredentials: true }
    );
  }
}

