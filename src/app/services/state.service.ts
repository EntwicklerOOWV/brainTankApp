import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'})
export class StateService {
  private serviceActive = new BehaviorSubject<boolean>(false);
  private location = new BehaviorSubject<{ latitude: number, longitude: number } | null>(null);
  private roofAreas = new BehaviorSubject<any[]>([]);
  private precipitationValues = new BehaviorSubject<any[]>([]);

  constructor(private apiService: ApiService) {}

  getRoofAreas(): Observable<any[]> {
    return this.roofAreas.asObservable();
  }

  getServiceActive(): Observable<boolean> {
    return this.serviceActive.asObservable();
  }

  updateServiceActive(active: boolean): void {
    this.serviceActive.next(active);
  }

  setLocation(latitude: number, longitude: number): void {
    this.location.next({ latitude, longitude });
    this.fetchPrecipitationValues();
  }

  getLocation(): Observable<{ latitude: number, longitude: number } | null> {
    return this.location.asObservable();
  }

  getPrecipitationValues(): Observable<any[]> {
    return this.precipitationValues.asObservable();
  }

  private fetchPrecipitationValues(): void {
    this.location.getValue() && this.apiService.getDashboardPrecipitationValues().pipe(
      tap(values => {
        this.precipitationValues.next(values);
      }),
      catchError(error => {
        console.error('Error fetching precipitation values', error);
        // Handle or notify error appropriately
        return [];  // Returning an empty array as a fallback
      })
    ).subscribe();  // This ensures that the API call is made and results are processed
  }
}
