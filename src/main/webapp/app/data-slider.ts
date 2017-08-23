import {Component} from '@angular/core';
import {DataService} from './data-service';
import {MdDialog} from '@angular/material';
import {OnlineDataDialogComponent} from './online-data-dialog/online-data-dialog.component';

@Component({
  selector: 'data-slider',
  templateUrl: 'data-slider.html',
  styleUrls: ['data-slider.css'],
})
export class DataSlider {
  constructor(private dataService : DataService,public dialog: MdDialog){}

  onChange(event:any){
    if(event.checked===true){this.openOnlineDataDialog()}
  }

  openOnlineDataDialog() {
    let dialogRef = this.dialog.open(OnlineDataDialogComponent,
       { width: '600', 
         data : { cernerState: this.dataService.getCernerState(), 
                 zynxState: this.dataService.getZynxState(), 
                 useCernerURL: this.dataService.getCernerURL(),
		 useAPIKey: this.dataService.getAPIKey(),
		 useAPIURL: this.dataService.getAPIURL()}}); 

    dialogRef.afterClosed().subscribe(result => {
         if (result !== null) {
		 this.dataService.setCernerState(result.cernerState);
		 this.dataService.setZynxState(result.zynxState);
		 this.dataService.setCernerURL(result.useCernerURL);
		 this.dataService.setAPIKey(result.useAPIKey);
		 this.dataService.setAPIURL(result.useAPIURL);
         }
    }); 
  }
}
