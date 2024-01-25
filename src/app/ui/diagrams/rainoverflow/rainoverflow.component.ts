import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { Chart as Chart } from "chart.js/auto";
import { DataStorageService } from '../../../services/data-storage.service';
@Component({
  selector: 'app-rainoverflow',
  templateUrl: './rainoverflow.component.html',
  styleUrls: ['./rainoverflow.component.scss'],
})
export class RainoverflowComponent  implements OnInit {

  @ViewChild('barChartRainOverflow') barChart;

  bars: any;
  colorArray: any;
  selectedTimeframeWaterlevel: any = {name:"daysofweek", value: "In den letzten 7 Tagen"};


  timeframes = [
    {name:"daysofweek", value: "In den letzten 7 Tagen"},
    {name:"daysofmonth", value: "Im letzten Monat"},
    {name:"monthsofyear", value: "In den letzten 12 Monaten"},
    {name:"today", value: "Heute"},

 ];
 constructor(    private dataStorageService: DataStorageService,
  ) {
    this.dataStorageService.getStoredData("selectedtimeframewaterlevel").then((savedTimeframeLevel)=>{
      this.selectedTimeframeWaterlevel = this.timeframes.filter(
        function(data){ return data.name == savedTimeframeLevel }
    );
    });


}
createLineChart() {

    this.bars = new Chart(this.barChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
        datasets: [{
          label: '',
          data: [2.5, 3.8, 5, 6.9, 6.9, 7.5, 10, 17],
          backgroundColor: 'rgb(255, 199, 39)',
          borderColor: 'rgb(255, 199, 39)',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },

        }
      }
    });
  }
  handleChange(e) {
    console.log("handle change: ")
    this.selectedTimeframeWaterlevel= e.detail.value;
    this.dataStorageService.set("selectedtimeframewaterlevel",this.selectedTimeframeWaterlevel.name);

    console.log("changed to : "+JSON.stringify(this.selectedTimeframeWaterlevel))

  }

  ngOnInit() {
  }

}
