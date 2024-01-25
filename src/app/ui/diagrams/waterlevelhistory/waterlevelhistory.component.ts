import { Component, OnInit, Input } from '@angular/core'
import { ViewChild } from '@angular/core'

import { Chart } from 'chart.js/auto'
import { DataStorageService } from '../../../services/data-storage.service'
import { ApiService } from '../../../services/api.service'
import {interval, Subscription} from "rxjs";

@Component({
  selector: 'app-waterlevelhistory',
  templateUrl: 'waterlevelhistory.component.html',
  styleUrls: ['./waterlevelhistory.component.scss'],
})
export class WaterlevelhistoryComponent implements OnInit {
  @ViewChild('barChart') barChart

  public checkConnection: Subscription;

  bars: any
  colorArray: any
  selectedTimeframeWaterlevel: any = {
    name: 'daysofweek',
    value: 'In den letzten 7 Tagen',
  }
  correctChartLabels: any = []
  correctChartDataSet: any = []

  timeframes = [
    { name: 'daysofweek', value: 'In den letzten 7 Tagen' },
    { name: 'daysofmonth', value: 'Im letzten Monat' },
    { name: 'monthsofyear', value: 'In den letzten 12 Monaten' },
    { name: 'today', value: 'Heute' },
  ]
  @Input() public typeOfDiagramm;
  @Input() public charttitle;
  gridColor = 'rgba(255,255,255,0.6)'

  constructor(
    private dataStorageService: DataStorageService,
    private apiService: ApiService,
  ) {

  }

  getDiagrammData(){
    if(this.typeOfDiagramm=="waterlevel"){
    }
  }
  createChart(){
    console.log("create chart")
    this.initialiseChartMetadata()
    this.createLineChart()
  }

  parsedMaxVal:any;
  maxValue:any=100;
  stepSize:any=this.maxValue/5;
  chartUrl:any="";
  unitName:any="%";
  datasetMultiplier:any=1000;

  initialiseChartMetadata(){
    switch (this.typeOfDiagramm) {
      case 'waterlevel':
        this.chartUrl ="?column=waterlevel"
        this.maxValue = 1000;
        this.stepSize = 200;
        this.unitName="L"
        break

      case 'projectedPPT':
        this.chartUrl ="?column=projectedPPT"
        this.maxValue = 15;
        this.stepSize = 15/5;
        this.datasetMultiplier=1;
        this.unitName="ml"
        break

      case 'actualPPT':
        this.chartUrl ="?column=actualPPT"
        this.maxValue = 15;
        this.stepSize = 15/5;
        this.datasetMultiplier=1;
        this.unitName="ml"
        break

      case 'overflow':
        this.chartUrl ="?column=overflow"
        this.maxValue = this.parsedMaxVal;
        this.stepSize = this.parsedMaxVal/5;
        this.unitName="L"
        break

      case 'stored':
        this.chartUrl ="?column=stored"
        this.maxValue = this.parsedMaxVal;
        this.stepSize = this.parsedMaxVal/5;
        this.unitName="L"
        break

      case 'drained':
        this.chartUrl ="?column=used"
        this.maxValue = this.parsedMaxVal;
        this.stepSize = this.parsedMaxVal/5;
        this.unitName="L"
        break

      default:
        this.chartUrl="get_daily_data"
        break
    }
  }
  createLineChart() {

    const DISPLAY = true
    const BORDER = true
    const CHART_AREA = true
    const TICKS = true
    var context = this;
    this.bars = new Chart(this.barChart.nativeElement, {
      type: 'line',
      data: {
        labels: [null,'MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
        datasets: [
          {
            label: '',
            data: [],
            backgroundColor: 'rgb(255, 199, 39)',
            borderColor: 'rgb(255, 199, 39)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
        backgroundColor: 'transparent',

        scales: {
          x: {
            border: {
              display: BORDER,
            },
            grid: {
              display: DISPLAY,
              drawOnChartArea: CHART_AREA,
              drawTicks: TICKS,
              color: this.gridColor
            },    ticks: {
              color:"white",
              font: {
                size: 14,
            }},
          },
          y: {
            beginAtZero: true,
            min:0,
            max:this.maxValue,
            ticks: {
              color:"white",
              font: {
                size: 14,
            },
              stepSize: this.stepSize,
              callback: function (value, index, values) {
                return value +context.unitName
              }.bind(context),
            },
            border: {
              display: false,
            },
            grid: {
              color: this.gridColor
            },
          },
        },
      },
    })
  }
  handleChange(e) {
    //console.log('handle change: ')
    this.selectedTimeframeWaterlevel = e.detail.value
    this.dataStorageService.set(
      'selectedtimeframewaterlevel'+this.typeOfDiagramm,
      this.selectedTimeframeWaterlevel.name,
    )
    this.getData();
  }
  updateChart() {
    console.log('Test Update');
    var parsedData:any =[]
    parsedData = this.correctChartDataSet.map((dataset) => Math.floor(dataset.average*this.datasetMultiplier))
    this.correctChartLabels = this.correctChartDataSet.map((dataset) => dataset.label)


  if(this.bars==undefined){
    this.createChart()
  }
  var context = this;
      this.bars.data = {
        labels: this.correctChartLabels,
        datasets: [
          {
            label: '',
            data: parsedData,
            backgroundColor: 'rgb(255, 199, 39)',
            borderColor: 'rgb(255, 199, 39)',
            borderWidth: 1,
          },
        ],
        options: {
          scales: {
            y: {
              max:this.maxValue,
                stepSize: this.stepSize,
                callback: function (value, index, values) {
                  return value +context.unitName
                }.bind(context),
              },
            },
          },
        },

      this.bars.update()
    }
  getData(){
    var endpointUrl = ""
    switch (this.selectedTimeframeWaterlevel.name) {
      case 'daysofweek':
        endpointUrl="get_weekly_data"
        break
      case 'daysofmonth':
        endpointUrl="get_monthly_data"

        break
      case 'monthsofyear':
        endpointUrl="get_yearly_data"

        break
      case 'today':
        endpointUrl="get_daily_data"

        break
      default:
        endpointUrl="get_daily_data"
        break
    }

    this.apiService
    .customGetRequest(endpointUrl+this.chartUrl)
    .subscribe({
      next: (data) => {
        console.log('response data getdiadata: ' + JSON.stringify(data))
        this.correctChartDataSet = data
        this.selectedTimeframeWaterlevel=this.selectedTimeframeWaterlevel[0]?this.selectedTimeframeWaterlevel[0]:this.selectedTimeframeWaterlevel
        this.updateChart()
        var parsedData:any =[]
        parsedData = this.correctChartDataSet.map((dataset) => Math.floor(dataset.average*this.datasetMultiplier))
        console.log("parsed data: "+JSON.stringify(parsedData))
        this.setMaxValues(parsedData)
      },
      error: (error) => {
        console.log('Error HTTPResponse' + JSON.stringify(error))
      },
    })



  }
  ngOnInit() {
    this.dataStorageService
    .getStoredData('selectedtimeframewaterlevel'+this.typeOfDiagramm)
    .then((savedTimeframeLevel) => {
      if(savedTimeframeLevel!==null&&savedTimeframeLevel!=""){
      this.selectedTimeframeWaterlevel = this.timeframes.filter(function (
        data,
      ) {
        return data.name == savedTimeframeLevel
      })
    }
      this.initialiseChartMetadata()
      this.getData();
      this.createChart();

    })
    this.checkConnection = interval(60000).subscribe(x => {
      this.updateChart();
    });
  }
  ionViewDidLeave(){
    this.checkConnection.unsubscribe();
  }
  setMaxValues(data:[] ) {
    // Ensure that the data array is not empty
    if (data.length === 0) {
      throw new Error('Data array is empty.')
    }

    // Find the maximum value in the array
    const maxVal = Math.max(...data)
    this.parsedMaxVal = maxVal + (maxVal/2)
  }
}
