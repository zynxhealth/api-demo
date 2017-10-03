import {Component} from '@angular/core';


import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute } from '@angular/router';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { config } from './config';
import { DataState, DataService} from './data-service';


@Component({
  selector: 'smart-fhir',
  templateUrl: 'smart-fhir.html'
})

export class smartFhir {

  constructor(
      private dataService : DataService,
      private http: HttpClient,
      private oauthService: OAuthService,
      private route: ActivatedRoute,
  ) {}

  ngOnInit() {

    this.dataService.smartFhirState = true

    // Code provided
    if(window["smartFhirParams"] != null && sessionStorage.getItem('smartFhirAuthState') == window["smartFhirParams"]["state"]){
      let url: string = config.smartFhirTokenServer

      let queryParams: string = "client_id=" + encodeURIComponent(config.smartFhirKey) + "&" +
        "code=" + window["smartFhirParams"]["code"] + "&" +
        "grant_type=authorization_code&" +
        "redirect_uri=" + encodeURIComponent(config.smartFhirRedirectUri);
        
        console.log(queryParams);

      this.http.post(url,
        queryParams,
        {
          responseType: 'json',
          headers: new HttpHeaders()
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Accept', "application/json")
        }
        ).subscribe(data => {
          this.dataService.smartFhirToken = data["access_token"]
          this.http.get(
            this.dataService.smartFhirApiUrl + "Patient/" + data["patient"],
            {
              responseType: 'json',
              headers: new HttpHeaders()
                .set('Authorization', 'Bearer ' + data["access_token"])
                .set('Accept', "application/json")
            }
          ).subscribe(data => {
            this.dataService.smartFhirId = data["id"]
            this.dataService.dataState = DataState.PatientSearch;
            this.dataService.dataStatePatientProgress = DataState.PatientSearch_ProgressStart;
            this.dataService.patientDatabase.addName(data["name"][0].given.join(" ") + " " + data["name"][0].family.join(" "), data["id"]);
            this.dataService.dataStatePatientProgress = DataState.PatientSearch_ProgressEnd;
          })
        });
    }

    // Launch request
    this.route.queryParams.subscribe(params => {

        let iss: string = params["iss"]
        let launch: string = params["launch"]

        if(iss && launch){

          let state = Math.round(Math.random()*100000000).toString();

          sessionStorage.setItem('smartFhirAuthState', state);

          let queryParams: string = "response_type=code&" +
            "client_id=" + encodeURIComponent(config.smartFhirKey) + "&" +
            "scope=" + encodeURIComponent("launch,openid,patient/Patient.read,patient/Condition.read") + "&" +
            "redirect_uri=" + encodeURIComponent(config.smartFhirRedirectUri) + "&" +
            "aud=" + encodeURIComponent(iss) + "&" +
            "launch=" + launch + "&" +
            "state=" + state;
            
           console.log(queryParams);

          window.location.href = config.smartFhirAuthServer + "?" + queryParams
        }

      })
  }
}
