import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { WaterlevelhistoryComponent } from '../ui/diagrams/waterlevelhistory/waterlevelhistory.component';
import { RainoverflowComponent } from '../ui/diagrams/rainoverflow/rainoverflow.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,


  ],
  declarations: [HomePage,WaterlevelhistoryComponent,RainoverflowComponent]
})
export class HomePageModule {}
