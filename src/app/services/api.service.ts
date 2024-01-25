import { Injectable } from '@angular/core';
import { HttpClient } from  '@angular/common/http';
import { DataStorageService } from '../services/data-storage.service'
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  defaultUrl = "http://192.168.20.107:5000/"
  basicUrl:any = "http://192.168.20.107:5000/"
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

//basicUrl:any = "http://192.168.20.158/getconfig"

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
      //console.log("correct ip is "+ipadress)
      localStorage.setItem("ipChange", "Success")
      this.basicUrl = "http://"+ipadress+this.port+"/"
    }else{
      //console.log("set default ip")

      localStorage.setItem("ipChange", "DefaultURLSet")
      this.basicUrl = this.defaultUrl
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
setUserConfig(payload){
  //console.log("set user config: "+JSON.stringify(payload))

  return this.http.post(this.basicUrl+this.setSettingsUrl,payload)
  .subscribe(
    data => console.log("Got data", data),
    error => console.error("Got error", error)
  );

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
}
