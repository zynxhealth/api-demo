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
  selector: 'content-names',
  styleUrls: ['content-names.css'],
  templateUrl: 'content-names.html',
})
export class ContentNames {
  displayedColumns = ['contentName'];
  dataSource: DataSource<any> | null;

  @ViewChild(MdSort) sort: MdSort;

  constructor(private dataService : DataService){}

  ngOnInit() {
    this.dataSource = this.dataService.getContentDataSource(this.sort);
  }

  rowClick(event:any){
    this.dataService.clearUnSelectedContent(event.target.innerText);
  }

  contentNamesVisible() {
    return (this.dataService.inStateProblemSelected() ||
            this.dataService.inStateContentSelected())
  }


}

