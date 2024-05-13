import { Component, OnInit } from '@angular/core'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import { Subscription, interval} from 'rxjs';
import { DataStorageService } from '../services/data-storage.service'
import { ApiService } from '../services/api.service'
import {animate, style, transition, trigger} from "@angular/animations";
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        style({opacity:0}),
        animate(500, style({opacity:1}))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(500, style({opacity:0}))
      ])
    ])
  ],
})
export class SettingsPage implements OnInit {
  debug = false
  roofAreas
  public roofAreaCombined
  public recommendedCOntainerAmount
  public messageData
  public messageSuccess = false
  public messageFail = false
  public messageIPSuccess = false
  public messageIPFail = false
  newRooftopIsCollapsed = true
  newRoofName = ''
  newRoofSize = ''
  manualAskForEmpty = true
  activeDashboardElements: Array<String> = []
  settingsJSON: any = []
  automationJSON:any= {
    ppt_trigger_value: 0,
    ppt_trigger_timerange: [5],
    user_notify: 0,
    drain_mode: 0,
    drain_amount: 0,
    preemptive_drain_time: 0,
  }
  latitude: any =null
  longitude: any = null
  selectedRainInterval:any=""
  ipAdress: any = null;
  savedIpAdress: any = null;
  lat: any = ""
  long: any = ""
  combinedRooftopVolume: any = 0
  possibleRainTimeframes: any = [5, 10, 15, 30]
  possibleDrainAmount: any = [0,20,40,60,80]
  selectedRainTimeframe = 5
  showNewPositionInfo=false
  settingsRefreshFinished:boolean = false;
  tracking_short:Subscription;
  controllerActive:boolean = false;
  serviceActive:boolean;
  updatingUserConfig:boolean = false;
  updatingAutomationConfig:boolean = false;
  inputFieldsChanged: boolean = false;
  constructor(
    private dataStorageService: DataStorageService,
    private apiService: ApiService,
    private stateService: StateService,
  ) {
    this.pingServiceActive();
    this.dataStorageService
      .getStoredData('activeDashboardElements')
      .then((activeDashboardElements) => {
        if (activeDashboardElements != null) {
          this.activeDashboardElements = activeDashboardElements
        }
      })

    this.initIpAddress();
    this.getUserConfig();
    this.getAutomationConfig();
  }

  ngOnInit() {
    this.roofAreas = this.getRoofArea()
    this.roofAreaCombined = this.getCombinedRoofArea()
    this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
    this.stateService.getServiceActive().subscribe(active => {
      this.serviceActive = active;
    });
  }

  ngAfterViewInit() {
    this.showNewPositionInfo = false;
    if(this.tracking_short == null){
      this.tracking_short = interval(5000)
      .subscribe(() => {
        this.initIpAddress();
        this.pingServiceActive();
        this.roofAreas = this.getRoofArea()
        this.roofAreaCombined = this.getCombinedRoofArea()
        this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
        this.getUserConfig();
        this.getAutomationConfig();
      });
    }
  }

  ngOnDestroy() {
    if(this.tracking_short){
      this.tracking_short.unsubscribe();
    }
  }

  initIpAddress(){
    this.dataStorageService
      .getStoredData('ipadress')
      .then((ipadress) => {
        if (ipadress != null) {
          this.ipAdress = ipadress
          this.savedIpAdress = ipadress
        }
      })
  }

  getUserConfig() {
    if (this.debug) {
      this.settingsJSON = {
        surfaces: [
          {
            name: 'Haus',
            size: '120',
          },
          {
            name: 'Garage',
            size: '120',
          },
        ],
        longitude: '1.234',
        latitude: '5.567',
      }
      this.roofAreas = this.getRoofArea()
      //console.log('roof' + JSON.stringify(this.roofAreas))
      this.combinedRooftopVolume = this.getCombinedRoofArea()
      this.latitude = this.settingsJSON['latitude']
      this.longitude = this.settingsJSON['longitude']
    } else {
      this.apiService.getUserConfig().subscribe({
        next: (data) => {
          this.settingsJSON = JSON.parse(JSON.stringify(data))
          if(!this.updatingUserConfig){
            this.latitude = this.settingsJSON['latitude']
            this.longitude = this.settingsJSON['longitude']
            this.stateService.setLocation(this.latitude,this.longitude);
            this.roofAreas = this.getRoofArea()
            this.combinedRooftopVolume = this.getCombinedRoofArea()
            this.roofAreaCombined = this.getCombinedRoofArea()
            this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
          }
        },
        error: (error) => {
          console.log('Error HTTPResponse' + JSON.stringify(error))
        },
      })
    }
  }

  initLatLon(){
    this.dataStorageService
    .getStoredData('lat')
    .then((lat) => {
      if (lat != null) {
        this.latitude = lat
      }
    })

    this.dataStorageService
    .getStoredData('long')
    .then((long) => {
      if (long != null) {
        this.longitude = long
      }
    })
  }

  toggleContent() {
    this.newRooftopIsCollapsed = !this.newRooftopIsCollapsed
  }
  getSavedPosition(){
  this.dataStorageService
  .getStoredData('lat')
  .then((lat) => {
    if (lat != null) {
      this.latitude = lat
    }
  })

  this.dataStorageService
  .getStoredData('long')
  .then((long) => {
    if (long != null) {
      this.longitude = long
    }
  })
}
  getRoofArea() {
    return this.settingsJSON['surfaces'] 
      ? this.settingsJSON['surfaces']
      : [{ empty: 0 }]
  }
  getCombinedRoofArea() {
    let totalSize = 0
    if(this.serviceActive){
      if(this.settingsJSON['surfaces']!=null){
        for (let i = 0; i < this.settingsJSON['surfaces'].length; i++) {
          totalSize += parseInt(this.settingsJSON['surfaces'][i].size)
        }
      }
    }
    this.combinedRooftopVolume = totalSize
    //console.log(totalSize)
    return totalSize
  }
  getRecommendedContainerAmount() {
    //console.log(this.roofAreaCombined)
    return Math.ceil(this.roofAreaCombined / 100)
  }
  getActiveDashboardElements() {}
  saveActiveDashboardElements() {
    this.dataStorageService.set(
      'activeDashboardElements',
      this.activeDashboardElements,
    )
  }

  async saveNewIP() {
    this.dataStorageService.set(
      'ipadress',
      this.ipAdress,
    )

    //console.log(localStorage.getItem("playerID"))
    await this.apiService.setCorrectIPFromSaved();
    this.savedIpAdress = this.ipAdress

    this.messageData = await localStorage.getItem("ipChange")
    //console.log(this.messageData)
    if (this.messageData) {
      if (this.messageData == "Success") {
        this.messageIPSuccess = true
        this.startTimerIPGreenAlert()
        localStorage.removeItem("ipChange");
      } else {
        this.messageIPFail = true
        this.startTimerIPRedAlert()
        localStorage.removeItem("ipChange");
      }
    }else {
      this.messageIPFail = true
      this.startTimerIPRedAlert()
      localStorage.removeItem("ipChange");
    }

    await this.apiService.sendPlayerID();
  }
  startTimerIPGreenAlert(){
    setTimeout(()=>{
      this.messageIPSuccess= false;
    }, 5000);
  }

  startTimerIPRedAlert(){
    setTimeout(()=>{
      this.messageIPFail= false;
    }, 10000);
  }
  changeActiveDashboardElemend(dashboardElement) {
    if (!this.checkActiveDashboardElement(dashboardElement)) {
      this.addActiveDashboardElement(dashboardElement)
    } else {
      this.removeActiveDashboardElement(dashboardElement)
    }
  }
  addActiveDashboardElement(dashboardElement) {
    this.activeDashboardElements.push(dashboardElement)
    this.saveActiveDashboardElements()
  }
  removeActiveDashboardElement(dashboardElement) {
    this.activeDashboardElements = this.activeDashboardElements.filter(
      (e) => e !== dashboardElement,
    )
    this.saveActiveDashboardElements()
  }
  checkActiveDashboardElement(dashboardElement) {
    return this.activeDashboardElements.includes(dashboardElement)
  }
  async saveUserConfig() {
    this.updatingUserConfig = true;
    let payload = {
      surfaces: this.roofAreas,
      longitude: parseFloat(this.longitude),
      latitude: parseFloat(this.latitude),
    }
    const success = await this.apiService.setUserConfig(payload);
    if (success) {
      this.updatingUserConfig = false;
    } else {
      console.log('Failed to update configuration');
    }
  }
  async saveAutomation() {
    this.inputFieldsChanged = false;
    let payload = this.automationJSON
   // payload.ppt_trigger_timerange= this.selectedRainInterval
   // payload.preemptive_drain_time= this.selectedRainTimeframe
    await this.apiService.setAutomationConfig(payload)
    this.messageData = await localStorage.getItem("message")
    this.messageData = await JSON.parse(this.messageData)
    if (this.messageData) {
      if (this.messageData["message"] == "Success") {
        this.updatingAutomationConfig = false;
        this.messageSuccess = true
        this.startTimer()
        localStorage.removeItem("message");
      }
      else {
        this.inputFieldsChanged = false;
        this.messageFail = true
        this.startTimerRedAlert()
        localStorage.removeItem("message");
      }
    }else {
      this.inputFieldsChanged = false;
      this.messageFail = true
      this.startTimerRedAlert()
      localStorage.removeItem("message");
    }
  }
  startTimer(){
    setTimeout(()=>{
      this.messageSuccess= false;
    }, 5000);
  }

  startTimerRedAlert(){
    setTimeout(()=>{
      this.messageFail= false;
    }, 10000);
  }

  getRecommendedContainer() {
    return Math.ceil(1800 / 1000)
  }
  saveNewRoof() {
    if (this.newRoofSize != '') {
      this.settingsJSON['surfaces'].push({
        name: this.newRoofName,
        size: parseInt(this.newRoofSize),
      })
      this.roofAreas = this.getRoofArea()
      this.roofAreaCombined = this.getCombinedRoofArea();
      this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
      this.saveUserConfig();
      this.newRoofName = ''
      this.newRoofSize = ''
      this.toggleContent();
    }
  }

  inputFieldChanged() {
    this.updatingAutomationConfig = true;
    this.inputFieldsChanged = true;
  }

  inputFieldFocused(){
    this.updatingAutomationConfig = true;
  }

  update_ppt_trigger_timerange(e){
    this.updatingAutomationConfig = true;
    this.inputFieldsChanged = true;
    this.automationJSON.ppt_trigger_timerange = e;
  }

  update_drainamount_event(e){
    this.updatingAutomationConfig = true;
    this.inputFieldsChanged = true;
    this.automationJSON.auto_drain_amount = e;
}

  update_preemptive_drain_time(e) {
    this.updatingAutomationConfig = true;
    this.inputFieldsChanged = true;
    this.automationJSON.preemptive_drain_time = e;
  }

  deleteRoof(index){
    this.settingsJSON["surfaces"].splice(index, 1)
    this.roofAreas = this.getRoofArea()
    this.roofAreaCombined = this.getCombinedRoofArea();
    this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
    this.saveUserConfig();
  }
  
  deletePosition(){
    this.latitude = null
    this.longitude = null

    this.stateService.setLocation(this.latitude, this.longitude);

    this.dataStorageService.set(
      'lat',
      this.latitude,
    )

    this.dataStorageService.set(
      'long',
      this.longitude,
    )

    this.saveUserConfig()
  }

  deleteIP(){
    this.ipAdress = null;
    this.saveNewIP()
  }

  getAutomationConfig() {
    if (this.debug) {
      this.automationJSON = {
        ppt_trigger_value: 2.4,
        ppt_trigger_timerange: 5,
        user_notify: 1,
        drain_mode: 1,
        drain_amount: 500,
      }
      this.selectedRainTimeframe = this.automationJSON.ppt_time_range

    } else {
      this.apiService.getAutomationConfig().subscribe({
        next: (data) => {
          //console.log('response data: ' + JSON.stringify(data))
          if(!this.updatingAutomationConfig){
            this.automationJSON = data
            this.selectedRainInterval = this.automationJSON.ppt_trigger_timerange
            this.selectedRainTimeframe = this.automationJSON.preemptive_drain_time
          }
        },
        error: (error) => {
          console.log('Error HTTPResponse' + JSON.stringify(error))
        },
      })
    }

  }

  async getCurrentPosition() {
    const coordinates = await Geolocation.getCurrentPosition()
    this.latitude = parseFloat(coordinates['coords']['latitude'].toFixed(4))
    this.longitude = parseFloat(coordinates['coords']['longitude'].toFixed(4))

    this.stateService.setLocation(this.latitude, this.longitude);

    this.messageData = await localStorage.setItem("lat",this.latitude);
    this.messageData = await localStorage.setItem("long",this.longitude);

    this.dataStorageService.set(
      'lat',
      this.latitude,
    )

    this.dataStorageService.set(
      'long',
      this.longitude,
    )
    
    this.saveUserConfig()

    this.displayLocationAddedInfo();
  }

  displayLocationAddedInfo() {
    this.showNewPositionInfo = true;
    setTimeout(() => {
      this.showNewPositionInfo = false;
    }, 5000);
  }

  async setTestPosition(){
    this.latitude = 0;
    this.longitude = 0;
    this.stateService.setLocation(this.latitude, this.longitude);
    this.messageData = await localStorage.setItem("lat",this.latitude);
    this.messageData = await localStorage.setItem("long",this.longitude);
    this.dataStorageService.set(
      'lat',
      this.latitude,
    )

    this.dataStorageService.set(
      'long',
      this.longitude,
    )
    console.log(
      'Current position latitude:',
      this.latitude,
    )
    console.log(
      'Current position lon:',
      this.longitude,
    )

    this.saveUserConfig()
    this.displayLocationAddedInfo();
  }
  compareWith(o1, o2) {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  displayRefreshNotification(event) {
    setTimeout(() => {
      this.settingsRefreshFinished = true;
      // You can optionally reset refreshFinished after a certain period of time
      setTimeout(() => {
        this.settingsRefreshFinished = false;
      }, 5000); // Reset after 5 seconds
      event.target.complete(); // Call complete() to indicate that the refresh has completed
    }, 2000);
  }

  handleSettingsRefresh(event) {
    this.getUserConfig();
    this.getAutomationConfig()
    this.pingServiceActive();
    this.displayRefreshNotification(event);
  }

  pingServiceActive() {
    this.apiService.checkServiceStatus().subscribe({
      next: (data) => {
        this.stateService.updateServiceActive(true);
      },
      error: (error) => {
        this.stateService.updateServiceActive(false);
      },
    });
  }
}
