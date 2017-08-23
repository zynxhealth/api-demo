import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { MdSlideToggle } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'jhi-online-data-dialog',
  templateUrl: './online-data-dialog.component.html',
  styleUrls: ['./online-data-dialog.component.css']
})
export class OnlineDataDialogComponent implements AfterViewInit {

 @ViewChild('formCernerState') formCernerStateSlideToggle: MdSlideToggle;
 @ViewChild('formZynxState') formZynxStateSlideToggle: MdSlideToggle;
 @ViewChild('formCernerURL') formCernerURLInput: ElementRef;
 @ViewChild('formAPIKey') formAPIKeyInput: ElementRef; 
 @ViewChild('formAPIURL') formAPIURLInput: ElementRef; 
  dataIn: any;

  constructor(public thisDialogRef: MdDialogRef<OnlineDataDialogComponent>, 
              @Inject(MD_DIALOG_DATA) public data: any) {
     this.dataIn = data;
  }

  ngAfterViewInit() {
     this.formCernerStateSlideToggle.checked=this.dataIn.cernerState; 
     this.formZynxStateSlideToggle.checked=this.dataIn.zynxState; 
     this.formCernerURLInput.nativeElement.value=this.dataIn.useCernerURL;
     this.formAPIKeyInput.nativeElement.value=this.dataIn.useAPIKey;
     this.formAPIURLInput.nativeElement.value=this.dataIn.useAPIURL; 

     this.onCheck() 
  }

  onCheck() {
     if(!this.formCernerStateSlideToggle.checked)
     {
       this.formCernerURLInput.nativeElement.disabled=true;
     }
     else
     {
       this.formCernerURLInput.nativeElement.disabled=false;
     }

     if(!this.formZynxStateSlideToggle.checked)
     {
       this.formAPIKeyInput.nativeElement.disabled=true;
       this.formAPIURLInput.nativeElement.disabled=true; 
     }
     else
     {
       this.formAPIKeyInput.nativeElement.disabled=false;
       this.formAPIURLInput.nativeElement.disabled=false; 
     }
  }

  onCloseSave() {
    this.thisDialogRef.close({cernerState: this.formCernerStateSlideToggle.checked, 
                               zynxState: this.formZynxStateSlideToggle.checked, 
                               useCernerURL: this.formCernerURLInput.nativeElement.value, 
                               useAPIKey: this.formAPIKeyInput.nativeElement.value, 
                               useAPIURL:  this.formAPIURLInput.nativeElement.value}) 
   }

  onCloseCancel() { 
    this.thisDialogRef.close(null); 
  }


}
