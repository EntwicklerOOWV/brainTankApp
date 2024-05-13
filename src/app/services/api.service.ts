import { Injectable } from '@angular/core';
import { HttpClient } from  '@angular/common/http';
import { DataStorageService } from '../services/data-storage.service'
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // defaultUrl = "http://192.168.20.107:5000/"
  // basicUrl:any = "http://192.168.20.107:5000/"
  basicUrl:any = null;
  port:any = ":5000"
  settingsUrl:any = "get_user_config"
  setSettingsUrl:any = "update_user_config"
  automationUrl:any = "get_automation_config"
  setAutomationUrl:any = "update_automation_config"
  dashboardConfigUrl:any = "get_dashboard_config"
  dashboardSetConfigUrl:any = "update_dashboard_config"
  drainUrl:any = "threshold_drain/"
  stopDrainUrl:any = "stop_drain"
  drainCompleteUrl:any = "threshold_drain/1"
  playerIDUrl:any ="update_player_ids"
  getServiceStatusUrl:any = "get_service_status"

  constructor(private http: HttpClient,    private dataStorageService: DataStorageService    ) {
    this.setCorrectIPFromSaved();
  }

  getTestData() {
    return this.http.get(this.basicUrl);
  }

  setCorrectIPFromSaved(){
    //console.log("set correct ip")
    //localStorage.removeItem("ipChange");
    this.dataStorageService
    .getStoredData('ipadress')
    .then((ipadress) => {
      if (ipadress != null) {
        localStorage.setItem("ipChange", "Success")
        this.basicUrl = "http://"+ipadress+this.port+"/"
      }else{
        localStorage.setItem("ipChange", "DefaultURLSet")
        this.basicUrl = null;
      }
    })
  }

  sendPlayerID() {
    let payload = {
      playerID: localStorage.getItem("playerID"),
    }
    //console.log("Player ID Sent " + playerID);
    return this.http.post(this.basicUrl+this.playerIDUrl,payload)
      .subscribe(
        data => console.log("Got data", data),
        error => console.error("Got error", error)
      );
  }

  getWaterLevel(interval:string="") {
    var correctEndpoint = "waterlevelhistory.json"
    switch (interval) {
      case "today":
        correctEndpoint = "waterlevelhistorydaily.json"
        break;
      case "daysofweek":
          correctEndpoint = "waterlevelhistoryweekly.json"
        break;
      case "daysofmonth":
          correctEndpoint = "waterlevelhistory.json"
        break;
      case "monthsofyear":
            correctEndpoint = "waterlevelhistoryyearly.json"
        break;

      default:
        // Code to be executed when timeframe does not match any case
        //console.log("Invalid timeframe");
        break;
    }
    return this.http.get(this.basicUrl+correctEndpoint);
  }

  getUserConfig(){
    return this.http.get(this.basicUrl+this.settingsUrl);
  }

  async setUserConfig(payload): Promise<boolean> {
    console.log("set user config: " + JSON.stringify(payload));
    try {
      const url = this.basicUrl + this.setSettingsUrl;
      const response = await this.http.post(url, payload).toPromise();
      console.log("Got data", response);
      return true;  // Return true if the request was successful
    } catch (error) {
      console.error("Got error", error);
      return false; // Return false if there was an error
    }
  }

  getAutomationConfig(){
    return this.http.get(this.basicUrl+this.automationUrl);
  }

  setAutomationConfig(payload){
    //console.log("set automation config: "+JSON.stringify(payload))

    return this.http.post(this.basicUrl+this.setAutomationUrl,payload)
    .subscribe(
      data => localStorage.setItem("message", JSON.stringify(data)),
      //data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  getDashboardConfig(){

    this.setCorrectIPFromSaved();
    //console.log("get dashboard config")

    return this.http.get(this.basicUrl+this.dashboardConfigUrl);
  }

  setDashbardConfig(payload){
    //console.log("setdashboard")
    return this.http.post(this.basicUrl+this.dashboardSetConfigUrl,payload)
    .subscribe(
      data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  drainComplete(payload){
    //console.log("make drain request")
    return this.http.get(this.basicUrl+this.drainUrl+"0.0")  .subscribe(
      data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  drain(payload){
    return this.http.get(this.basicUrl+this.drainUrl+payload)  .subscribe(
      data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  stopDrain(){
    return this.http.get(this.basicUrl+this.stopDrainUrl)  .subscribe(
      data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  customGetRequest(url){
    return this.http.get(this.basicUrl+url)
  }

  customPostRequest(url,payload){
    return this.http.post(this.basicUrl+url,payload)  .subscribe(
      data => console.log("Got data", data),
      error => console.error("Got error", error)
    );
  }

  checkDeviceStatus(){
    return this.http.get(this.basicUrl)
  }

  checkServiceStatus(){
    return this.http.get(this.basicUrl+this.getServiceStatusUrl)
  }

  checkControllerStatus(){
    return this.http.get(this.basicUrl)
  }

  getDashboardPrecipitationValues(): Observable<any[]> {
    return this.getDashboardConfig().pipe(
      map(data => {
        // Check for null data or missing keys
        if (!data || !data['forecast'] || data['current'] === undefined) {
          throw new Error('Incomplete or missing data'); // Use throw to raise an error directly within map
        }

        let forecast = data['forecast'];
        let fiveMinVal = data['current'];
        let oneHourVal = this.summarizeForecastValues(11, forecast, fiveMinVal);
        let twoHourVal = this.summarizeForecastValues(23, forecast, fiveMinVal);

        return [fiveMinVal, oneHourVal, twoHourVal];
      }),
      catchError(error => {
        // Handle both the API fetch errors and errors thrown from map
        console.error('Error fetching or processing data:', error);
        return throwError(() => new Error('Error fetching precipitation values'));
      })
    );
  }

  private summarizeForecastValues(num: number, forecast: any, fiveMinVal: number): number {
    let values: number[] = Object.values(forecast).slice(0, num).map(value => Number(value));
    const sum: number = values.reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0);
    return sum + fiveMinVal;
  }
}
