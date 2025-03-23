import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrayerRequest, PrayerRequestUpdate } from '../models/prayer-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrayerService {
  private apiUrl = `${environment.apiUrl}/prayer-requests`;

  constructor(private http: HttpClient) { }

  getRequests(): Observable<PrayerRequest[]> {
    return this.http.get<PrayerRequest[]>(this.apiUrl);
  }

  getRequest(id: number): Observable<PrayerRequest> {
    return this.http.get<PrayerRequest>(`${this.apiUrl}/${id}`);
  }

  createRequest(request: PrayerRequest): Observable<PrayerRequest> {
    return this.http.post<PrayerRequest>(this.apiUrl, request);
  }

  updateRequest(id: number, request: PrayerRequest): Observable<PrayerRequest> {
    return this.http.put<PrayerRequest>(`${this.apiUrl}/${id}`, request);
  }

  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addUpdate(id: number, update: PrayerRequestUpdate): Observable<PrayerRequestUpdate> {
    return this.http.post<PrayerRequestUpdate>(`${this.apiUrl}/${id}/updates`, update);
  }

  getUpdates(id: number): Observable<PrayerRequestUpdate[]> {
    return this.http.get<PrayerRequestUpdate[]>(`${this.apiUrl}/${id}/updates`);
  }

  updateUpdate(id: number, updateId: number, update: PrayerRequestUpdate): Observable<PrayerRequestUpdate> {
    return this.http.put<PrayerRequestUpdate>(`${this.apiUrl}/${id}/updates/${updateId}`, update);
  }

  deleteUpdate(id: number, updateId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/updates/${updateId}`);
  }

  createRequestUpdate(requestId: number, update: PrayerRequestUpdate): Observable<PrayerRequestUpdate> {
    return this.http.post<PrayerRequestUpdate>(`${this.apiUrl}/${requestId}/updates`, update);
  }
}
