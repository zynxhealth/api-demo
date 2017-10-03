import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import {Component} from '@angular/core';
import {DataService} from './data-service';
import * as vkbeautify from 'vkbeautify';

@Component({
  selector: 'content-card',
  templateUrl: 'content-card.html',
  styleUrls: ['content-card.css'],
})
export class ContentCard {
  constructor(private dataService : DataService,private sanitizer: DomSanitizer){}
  contentCardHTML:any;
  contentCardRaw:any;

//  contentCardHTML() {
//   return (this.dataService.getContentSelected(""));
//  }

  contentCardVisible() {
   if(this.dataService.inStateContentSelected()){
     this.contentCardHTML = this.sanitizer.bypassSecurityTrustHtml(this.dataService.getContentSelected(""));
     this.contentCardRaw = vkbeautify.xml(this.dataService.getRawContentSelected(""));
   }
   return (this.dataService.inStateContentSelected())
  }

}
