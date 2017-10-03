import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRouteSnapshot, NavigationEnd, RoutesRecognized } from '@angular/router';

import { Title } from '@angular/platform-browser';
import { StateStorageService } from '../../shared';
import { DataService } from './../../data-service';

@Component({
    selector: 'jhi-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.css'],
})
export class JhiMainComponent implements OnInit {

    constructor(
        private titleService: Title,
        private router: Router,
        private $storageService: StateStorageService,
        private dataService : DataService,
    ) {}

    private getPageTitle(routeSnapshot: ActivatedRouteSnapshot) {
        let title: string = (routeSnapshot.data && routeSnapshot.data['pageTitle']) ? routeSnapshot.data['pageTitle'] : 'Zynx Demo!';
        if (routeSnapshot.firstChild) {
            title = this.getPageTitle(routeSnapshot.firstChild) || title;
        }
        return title;
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.titleService.setTitle(this.getPageTitle(this.router.routerState.snapshot.root));
            }
        });
    }

    contentCardVisible() {
     return (this.dataService.inStateContentSelected())
    }

    contentNamesVisible() {
      return (this.dataService.inStateProblemSelected() ||
              this.dataService.inStateContentSelected())
    }

    problemNamesVisible() {
      return (this.dataService.inStatePatientSelected() ||
              this.dataService.inStateProblemSelected() ||
              this.dataService.inStateContentSelected())
    }
}
