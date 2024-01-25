import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import OneSignal from 'onesignal-cordova-plugin';
import { ApiService } from './services/api.service';
import {interval} from "rxjs";


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  currentSite:string="home";

  constructor(
    private router: Router,
    private apiService: ApiService,
  ){
    if (Capacitor.getPlatform() === 'android'){
    this.OneSignalInit();
    }
  };

setCurrentSite(siteName:string){
  console.log("set current site"+siteName)
  this.router.navigate(['/app-waterlevelhistory']);
  this.currentSite=siteName
}
// Call this function when your app starts
OneSignalInit(): void {
  // Uncomment to set OneSignal device logging to VERBOSE
  // OneSignal.setLogLevel(6, 0);

  // NOTE: Update the setAppId value below with your OneSignal AppId.
  OneSignal.setAppId("6013af88-5564-4a94-afb1-d364cb366f21");
  OneSignal.setNotificationOpenedHandler(function(jsonData) {
    console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
  });

  // Prompts the user for notification permissions.
  //    * Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 7) to better communicate to your users what notifications they will get.
  OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
    console.log("User accepted notifications: " + accepted);
  });

  OneSignal.getDeviceState((response) => {
    //console.log(response.userId);
    localStorage.setItem("playerID", response.userId)
    this.apiService.sendPlayerID();
  })
}


ngOnInit() {
  //console.log('this.router.url', this.router.url);
}

}
