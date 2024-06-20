import { Component,ViewChild, OnDestroy, OnInit  } from '@angular/core';
import { DataStorageService } from '../services/data-storage.service';
import { ApiService } from '../services/api.service'
import { Subscription, interval, Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CheckboxCustomEvent } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { StateService } from '../services/state.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit, OnDestroy {
  @ViewChild('waterlevel') waterlevel;
  @ViewChild('projectedPPT') projectedPPT;
  @ViewChild('actualPPT') actualPPT;
  @ViewChild('overflow') overflow;
  @ViewChild('stored') stored;
  @ViewChild('drained') drained;
  dashboardData:any={"waterlevel":0};
  drainThreshold=20;
  latitude:any = null;
  longitude:any = null;
  dashboardPrecipitationValues:any=[];
  activeDashboardElements:any=[];
  buttonAuto = false
  isDraining = false
  tracking_short:Subscription;
  serviceActive:boolean = false;
  termsAccepted:boolean = false;
  ipAddress:any;
  homeRefreshFinished:boolean = false;
  private precipitationSubscription: Subscription;
  private statusSubscription: Subscription;
  showTerms:boolean=true;
  constructor(
    private dataStorageService: DataStorageService,
    private apiService: ApiService,
    private http: HttpClient,
    private storage: Storage,
    private stateService: StateService,
    private platform:Platform
  ){  
    this.checkTermsVisibility();
    this.getDashboardData();
    this.getDashboardPrecipitationValues();
  }

  ngOnInit() {

    this.checkTermsVisibility();
    this.loadTermsAccepted();

    this.stateService.getServiceActive().subscribe(active => {
      this.serviceActive = active;
    });

    this.statusSubscription = this.stateService.getServiceActive().subscribe(active => {
      this.serviceActive = active;
    });

    if(this.tracking_short == null){
    this.tracking_short = interval(5000)
      .subscribe(() => {
        this.getDashboardData();
        this.updateIpAddress();
      });
    }

    this.precipitationSubscription = interval(5000).subscribe(() => {
      this.getDashboardPrecipitationValues();
    });

  this.dataStorageService
    .getStoredData('activeDashboardElements')
      .then((activeDashboardElements) => {
        if(activeDashboardElements!=null){
          this.activeDashboardElements = activeDashboardElements
        }
    })
  }

  updateIpAddress(){
    this.dataStorageService
    .getStoredData('ipadress')
    .then((ipadress) => {
      this.ipAddress = ipadress;
    })
  }

  ionViewWillEnter(){
    console.log("ionViewWillEnter: termsAccepted: ", this.termsAccepted, " showTerms: ", this.showTerms, " serviceActive: ", this.serviceActive);
    console.log("ionViewWillEnter");
    this.updateIpAddress();
    this.stateService.getServiceActive().subscribe({
      next: (active) => {
        this.serviceActive = active;
      },
      error: (error) => {
        console.log("error updating service active value in home screen");
      }
    });
    this.stateService.getLocation().subscribe({
      next: (location) => {
        this.latitude = location?.latitude;
        this.longitude = location?.longitude;
      },
      error: (error) => {
        console.log("error updating location values in home screen");
      }
    });

    this.dataStorageService
    .getStoredData('activeDashboardElements')
      .then((activeDashboardElements) => {
        if(activeDashboardElements!=null){
          this.activeDashboardElements = activeDashboardElements
        }
    })
  }

  ngOnDestroy() {
    if(this.tracking_short){
      this.tracking_short.unsubscribe();
    }
    if (this.precipitationSubscription) {
      this.precipitationSubscription.unsubscribe();
    }
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
  getJsonData(url: string): Observable<any> {
    return this.http.get(url);
  }
  getSwatApiUrl(lat:number, lon:number){
    const baseUrl = 'https://swat.itwh.de/Vorhersage';
    const urlParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
    });
    let url = `${baseUrl}?${urlParams.toString()}`;
    return url;
  }

  getTestSwatApiUrl(lat:number, lon:number) {
    return "https://swat.itwh.de/Vorhersage/GetVorhersageTest?lat=0&lon=0"
  }

  summarizeForecastValues(num:number,forecast:any,fiveMinVal:number): number {
    let values = Object.values(forecast); // Extract all values from the object
    values = values.slice(0, num); // Get the first 10 values
    const sum = values.reduce((accumulator:number, currentValue) => accumulator + (currentValue as number), 0);
    return sum+fiveMinVal;
  }

  getDashboardPrecipitationValues() {
    this.apiService.getDashboardPrecipitationValues().subscribe({
      next: (precipitationValues) => {
        this.dashboardPrecipitationValues = precipitationValues.map(value => value.toFixed(0));;
        // Handle the data as needed in the component
      },
      error: (error) => {
        console.error('Failed to load precipitation values:', error);
        // Handle the error appropriately in the component
      }
    });
  }

  getDashboardData(){
    var context = this
    setTimeout(function(){
      context.apiService
      .getDashboardConfig()
      .subscribe({
        next: (data) => {
          context.dashboardData = data;
          context.isDraining = data["is_draining"];
          context.drainThreshold = parseInt(data["drain_threshold"]*100+"");
        },
        error: (error) => {
          console.log('Error HTTPResponse' + JSON.stringify(error));
        },
      })
    }.bind(context), 1000);
  }
  isDashboardEmpty(){
    return this.activeDashboardElements == null||this.activeDashboardElements == ""||this.activeDashboardElements.length<=0;
  }
  isLocationEmpty(){
    let isEmpty = this.longitude == null && this.latitude == null;
    return isEmpty;
  }
  checkActiveDashboardElement(dashboardElement) {
    return this.activeDashboardElements.includes(dashboardElement)
  }
  saveDashboardData(mode){
    let payload = this.dashboardData;
    payload["drain_threshold"] = this.drainThreshold/100;
    /*payload["control_mode"]=this.dashboardData.control_mode
    this.buttonAuto = this.dashboardData.control_mode*/
    payload["control_mode"]=mode
    this.buttonAuto = mode
    this.apiService
    .setDashbardConfig(payload)
    if(this.isDraining)this.apiService.stopDrain();
  }
  drainPartial(){
    this.apiService
    .drain(this.drainThreshold/100)
  }
  drainComplete(){
    this.apiService
    .drainComplete("")
  }
  stopDrain(){
    this.apiService.stopDrain()
  }
  async onTermsChanged(event: Event) {
    const ev = event as CheckboxCustomEvent;
    if(ev.detail.checked){
      await this.acceptTerms();
    }
  }

  async checkTermsVisibility() {

    if(this.platform.is('ios')){
      this.showTerms = false;
      this.termsAccepted = true;
    } else {
      await this.loadTermsAccepted();
      this.showTerms = !this.termsAccepted;
    }
  }

  async loadTermsAccepted() {
    // Load the value from storage. If it doesn't exist, default to false.
    this.termsAccepted = (await this.storage.get('termsAccepted')) || false;
  }
  async acceptTerms() {
    // Set the variable to true and save it to storage.
    await this.storage.set('termsAccepted', true);
    await this.loadTermsAccepted();
  }

  displayRefreshNotification(event) {
    setTimeout(() => {
      this.homeRefreshFinished = true;
      setTimeout(() => {
        this.homeRefreshFinished = false;
      }, 5000);
      event.target.complete();
    }, 2000);
  }
  handleHomeRefresh(event) {
    this.getDashboardData();
    this.displayRefreshNotification(event);
  }

  // pingServiceActive() {
  //   this.apiService.checkServiceStatus().subscribe({
  //     next: (data) => {
  //       console.log("home pingServiceActive data: ", data);
  //       this.stateService.updateServiceActive(true);
  //     },
  //     error: (error) => {
  //       console.log("home pingServiceActive error: ", error);
  //       this.stateService.updateServiceActive(false);
  //     },
  //   });
  // }
}
