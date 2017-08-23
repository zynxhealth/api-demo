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
  selector: 'problem-names',
  styleUrls: ['problem-names.css'],
  templateUrl: 'problem-names.html',
})
export class ProblemNames {
  displayedColumns = ['problemName'];
  dataSource: DataSource<any> | null;

  @ViewChild(MdSort) sort: MdSort;

  constructor(private dataService : DataService){}

  ngOnInit() {
    this.dataSource = this.dataService.getProblemDataSource(this.sort);
  }

  rowClick(event:any){
    this.dataService.clearUnSelectedProblems(event.target.innerText);
  }

  progressBarVisible() {
   return (this.dataService.inStateProblemSearchStart())
  }

  problemNamesVisible() {
    return (this.dataService.inStatePatientSelected() ||
            this.dataService.inStateProblemSelected() ||
            this.dataService.inStateContentSelected())
  }

}

