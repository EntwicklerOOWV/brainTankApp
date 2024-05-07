import { Component, OnInit } from '@angular/core'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import { interval} from 'rxjs';
import { DataStorageService } from '../services/data-storage.service'
import { ApiService } from '../services/api.service'
import {animate, style, transition, trigger} from "@angular/animations";

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
  ipAdress: any = ""
  savedIpAdress: any = ""
  lat: any = ""
  long: any = ""
  combinedRooftopVolume: any = 0
  possibleRainTimeframes: any = [5, 10, 15, 30]
  possibleDrainAmount: any = [0,20,40,60,80]
  selectedRainTimeframe = 5
  showNewPositionInfo=false
  settingsRefreshFinished:boolean = false;
  tracking_short:any;
  controllerActive:boolean = false;
  serviceActive:boolean = false;
  constructor(
    private dataStorageService: DataStorageService,
    private apiService: ApiService,
  ) {
    this.pingServiceActive();
    this.dataStorageService
      .getStoredData('activeDashboardElements')
      .then((activeDashboardElements) => {
        if (activeDashboardElements != null) {
          this.activeDashboardElements = activeDashboardElements
        }
      })

      this.dataStorageService
      .getStoredData('ipadress')
      .then((ipadress) => {
        if (ipadress != null) {
          this.ipAdress = ipadress
          this.savedIpAdress = ipadress
        }
      })
    this.getSettingsJSON()
    this.getAutomationJSON()
    this.getSavedPosition();
    this.pingControllerActive();
  }

  ngOnInit() {
    this.roofAreas = this.getRoofArea()
    this.roofAreaCombined = this.getCombinedRoofArea()
    this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
    this.pingControllerActive();
    this.pingServiceActive();
  }

  ngAfterViewInit() {
    if(this.tracking_short == null){
      this.tracking_short = interval(5000)
      .subscribe(() => {
        this.pingServiceActive();
        console.log("settings updated from tracking_short")
        this.roofAreas = this.getRoofArea()
        this.roofAreaCombined = this.getCombinedRoofArea()
        this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()
        this.getSettingsJSON();
        this.getAutomationJSON();
        this.getSavedPosition();
        this.pingControllerActive();
      });
    }
  }

  ngOnDestroy() {
    this.tracking_short.unsubscribe();
  }

  getSettingsJSON() {
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
      this.unpackSettingsJSON()
    } else {
      this.apiService.getUserConfig().subscribe({
        next: (data) => {
          //console.log('response data: ' + JSON.parse(JSON.stringify(data)))
          this.settingsJSON = JSON.parse(JSON.stringify(data))
          //console.log('js ' + JSON.stringify(this.settingsJSON))
          this.roofAreas = this.getRoofArea()
          //console.log('roof' + JSON.stringify(this.roofAreas))
          this.combinedRooftopVolume = this.getCombinedRoofArea()
          this.roofAreaCombined = this.getCombinedRoofArea()
          this.recommendedCOntainerAmount = this.getRecommendedContainerAmount()

          this.unpackSettingsJSON()
        },
        error: (error) => {
          console.log('Error HTTPResponse' + JSON.stringify(error))
        },
      })
    }
  }

  unpackSettingsJSON() {
    this.latitude = this.settingsJSON['longitude']
    this.longitude = this.settingsJSON['latitude']
    //console.log('pos: ' + this.latitude + '_' + this.longitude)
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
    if(this.serviceActive){
      //console.log('settingsjson_' + JSON.stringify(this.settingsJSON))
      return this.settingsJSON['surfaces']
        ? this.settingsJSON['surfaces']
        : [{ empty: 0 }]
    } else return [{ empty: 0 }]
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
  saveUserConfig() {
    let payload = {
      surfaces: this.roofAreas,
      longitude: parseFloat(this.longitude),
      latitude: parseFloat(this.latitude),
    }
    this.apiService.setUserConfig(payload)
  }
  async saveAutomation() {
    let payload = this.automationJSON
   // payload.ppt_trigger_timerange= this.selectedRainInterval
   // payload.preemptive_drain_time= this.selectedRainTimeframe
    console.log("save automation"+JSON.stringify(this.automationJSON))
    await this.apiService.setAutomationConfig(payload)
    this.messageData = await localStorage.getItem("message")
    //console.log(this.messageData)
    this.messageData = await JSON.parse(this.messageData)
    if (this.messageData) {
      if (this.messageData["message"] == "Success") {
        this.messageSuccess = true
        this.startTimer()
        localStorage.removeItem("message");
      }
      else {
        this.messageFail = true
        this.startTimerRedAlert()
        localStorage.removeItem("message");
      }
    }else {
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
    }
  }

  update_ppt_trigger_timerange(e){
      this.automationJSON.ppt_trigger_timerange = e;
  }

  update_drainamount_event(e){
    this.automationJSON.auto_drain_amount = e;
}

  update_preemptive_drain_time(e) {
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
    this.dataStorageService.set(
      'lat',
      this.latitude,
    )

    this.dataStorageService.set(
      'long',
      this.longitude,
    )

    this.showNewPositionInfo = true;
    this.saveUserConfig()
  }

    deleteIP(){
    this.ipAdress = ""
    this.saveNewIP()
  }
  getAutomationJSON() {
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
          this.automationJSON = data
          this.selectedRainInterval = this.automationJSON.ppt_trigger_timerange
          this.selectedRainTimeframe = this.automationJSON.preemptive_drain_time

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
    /*console.log(
      'Current position det:',
      parseFloat(coordinates['coords']['latitude'].toFixed(4)),
    )
    console.log(
      'Current position det:',
      parseFloat(coordinates['coords']['longitude'].toFixed(4)),
    )*/
    this.showNewPositionInfo = true;
    this.saveUserConfig()

  }

  async setTestPosition(){
    this.latitude = 0;
    this.longitude = 0;
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
    this.showNewPositionInfo = true;
    this.saveUserConfig()
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
    this.getSettingsJSON();
    this.getAutomationJSON()
    this.pingControllerActive();
    this.pingServiceActive();
    this.displayRefreshNotification(event);
  }

  pingControllerActive() {
    // This function uses HTTP request to check if the server is reachable
    // console.log("pingCOntrollerActive with http://" + this.ipAdress);
    // fetch('http://' + this.ipAdress, { method: 'HEAD' })
    //   .then(response => {
    //     if (response.ok) {
    //       console.log('Raspberry Pi is reachable under ipAdress: ' + this.ipAdress);
    //       this.controllerActive = true; // Set controllerActive to true if reachable
    //     } else {
    //       console.log('Raspberry Pi is not reachable under ipAdress: ' + this.ipAdress);
    //       this.controllerActive = false; // Set controllerActive to false if not reachable
    //     }
    //   })
    //   .catch(error => {
    //     console.log('Raspberry Pi is not reachable under ipAdress: ' + this.ipAdress);
    //     this.controllerActive = false; // Set controllerActive to false if not reachable
    //   });
  }

  pingServiceActive(){
    //set the serviceActive boolean to true of the this.checkServiceStatus returns a 200 status code
    this.apiService.checkServiceStatus().subscribe({
      next: (data) => {
        console.log('Service Status response data: ' + JSON.stringify(data))
        this.serviceActive = true;
      },
      error: (error) => {
        console.log('Service Status Error HTTPResponse' + JSON.stringify(error))
        this.serviceActive = false;
      },
    })
  }
}
