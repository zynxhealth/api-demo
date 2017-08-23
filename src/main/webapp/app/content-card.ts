import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import {Component} from '@angular/core';
import {DataService} from './data-service';

@Component({
  selector: 'content-card',
  templateUrl: 'content-card.html',
  styleUrls: ['content-card.css'],
})
export class ContentCard {
  constructor(private dataService : DataService,private sanitizer: DomSanitizer){}
  contentCardHTML:any;

//  contentCardHTML() {
//   return (this.dataService.getContentSelected(""));
//  } 

  contentCardVisible() {
   if(this.dataService.inStateContentSelected()){
     this.contentCardHTML = this.sanitizer.bypassSecurityTrustHtml(this.dataService.getContentSelected(""));
   }
   return (this.dataService.inStateContentSelected())
  }

}
