import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ProfileService } from '../profiles/profile.service';
import { Principal, LoginModalService, LoginService } from '../../shared';

import { VERSION, DEBUG_INFO_ENABLED } from '../../app.constants';

import { config } from '././../../config';
import { DataService, DataState } from './../../data-service';

@Component({
    selector: 'jhi-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: [
        'navbar.scss'
    ]
})
export class NavbarComponent implements OnInit {

    inProduction: boolean;
    isNavbarCollapsed: boolean;
    languages: any[];
    swaggerEnabled: boolean;
    modalRef: NgbModalRef;
    version: string;

    constructor(
        private dataService : DataService,
        private loginService: LoginService,
        private principal: Principal,
        private loginModalService: LoginModalService,
        private profileService: ProfileService,
        private router: Router
    ) {
        this.version = VERSION ? 'v' + VERSION : '';
        this.isNavbarCollapsed = true;
    }

    ngOnInit() {
        this.profileService.getProfileInfo().subscribe((profileInfo) => {
            this.inProduction = profileInfo.inProduction;
            this.swaggerEnabled = profileInfo.swaggerEnabled;
        });
    }

    collapseNavbar() {
        this.dataService.smartFhirState = false
        this.dataService.dataState = DataState.Start;
        this.dataService.dataStatePatientProgress = DataState.PatientSearch_ProgressEnd;
        this.dataService.dataStateProblemProgress = DataState.PatientSelected_ProgressEnd;
        this.isNavbarCollapsed = true;
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    login() {
        this.modalRef = this.loginModalService.open();
    }

    logout() {
        this.collapseNavbar();
        this.loginService.logout();
        this.router.navigate(['']);
    }

    openSmartFhirAuth(){

      let clientId: string = "18257c4b-de4b-4d79-89a4-cc923bdaee75"
      let launchUri: string = window.location.protocol + "//" + window.location.host + "/#/smart_fhir";

      let state = Math.round(Math.random()*100000000).toString();

      sessionStorage.setItem('smartFhirAuthState', state);

      let queryParams: string = "response_type=code&" +
        "client_id=" + encodeURIComponent(config.smartFhirKey) + "&" +
        "scope=" + encodeURIComponent("launch") + "&" +
        "redirect_uri=" + encodeURIComponent(config.smartFhirRedirectUri) + "&" +
        "aud=" + encodeURIComponent(this.dataService.smartFhirApiUrl.replace(/\/$/, "")) + "&" +
        "state=" + state;

      window.location.href = config.smartFhirAuthServer + "?" + queryParams
    }

    toggleNavbar() {
        this.isNavbarCollapsed = !this.isNavbarCollapsed;
    }

    getImageUrl() {
        return this.isAuthenticated() ? this.principal.getImageUrl() : null;
    }
}
