import {Component, ViewChild} from '@angular/core';
import {DataSource} from '@angular/cdk';
import {MdSort} from '@angular/material';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {DataService} from './data-service';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

@Component({
  selector: 'patient-names',
  styleUrls: ['patient-names.css'],
  templateUrl: 'patient-names.html',
})
export class PatientNames {
  displayedColumns = ['userName'];
  dataSource: DataSource<any> | null;

  constructor(private dataService : DataService){}

  ngOnInit() {
    this.dataSource = this.dataService.getDataSource();
  }

  rowClick(event:any){
    this.dataService.clearUnSelectedNames(event.target.innerText);
  }

  progressBarVisible() {
   return (this.dataService.inStatePatientSearchStart())
  }

  patientNamesVisible() {
    return (this.dataService.inStatePatientSearch() || 
            this.dataService.inStatePatientSelected() ||
            this.dataService.inStateProblemSelected() ||
            this.dataService.inStateContentSelected())
  }
}

