import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Claim, ClaimResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private apiUrl = `${environment.apiUrl}/claims`;

  constructor(private http: HttpClient) {}

  /** Receivers only. Marks the food as claimed on the backend. */
  createClaim(foodId: string): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(this.apiUrl, { foodId });
  }

  /** The signed-in receiver's claims, newest first. `food` is populated, `food.donor` is an id. */
  getMyClaims(): Observable<Claim[]> {
    return this.http.get<ClaimResponse>(this.apiUrl).pipe(
      map(r => (Array.isArray(r?.claims) ? r.claims : [])),
      map(claims => [...claims].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    );
  }
}
