import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'})
export class StateService {
  private serviceActive = new BehaviorSubject<boolean>(false);
  private location = new BehaviorSubject<{ latitude: number, longitude: number } | null>(null);
  private roofAreas = new BehaviorSubject<any[]>([]);
  private precipitationValues = new BehaviorSubject<any[]>([]);
  private statusCheckInterval = 1500;   
  private statusSubscription: Subscription;

  constructor(private apiService: ApiService) {
    this.startPinging();
  }

  startPinging() {
    this.statusSubscription = interval(this.statusCheckInterval).subscribe(() => {
      this.pingServiceActive();
    });
  }

  pingServiceActive(){
    this.apiService.checkServiceStatus().pipe(
      tap(data => {
        console.log('Service status check successful', data);
        this.updateServiceActive(true);
      }),
      catchError(error => {
        console.error('Service status check failed', error);
        this.updateServiceActive(false);
        return [];
      })
    ).subscribe();
  }

  getServiceActive(): Observable<boolean> {
    return this.serviceActive.asObservable();
  }

  updateServiceActive(active: boolean): void {
    this.serviceActive.next(active);
  }

  getRoofAreas(): Observable<any[]> {
    return this.roofAreas.asObservable();
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

  ngOnDestroy() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
