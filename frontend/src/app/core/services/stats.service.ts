import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getHomeStats(): Observable<any> {
    // For now, return mock data. In production, create an endpoint for public stats
    return of({
      foodSaved: '1,234',
      communitiesFed: '567',
      activeDonors: '89',
      ngosConnected: '45'
    });
  }
}

