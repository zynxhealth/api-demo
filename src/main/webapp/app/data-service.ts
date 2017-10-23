import { Injectable } from '@angular/core';
import {DataSource} from '@angular/cdk';
import {MdSort} from '@angular/material';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { config } from './config';
import { zynx_config } from './config';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

// Notes
// Curl for searching patients.
//
// curl -v -H "ACCEPT:application/json"  https://fhir-open.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Patient?name=al*
//

export enum DataState {
  Start,
  PatientSearch,
  PatientSearch_ProgressStart,
  PatientSearch_ProgressEnd,
  PatientSelected,
  PatientSelected_ProgressStart,
  PatientSelected_ProgressEnd,
  ProblemSelected,
  ContentSelected
}

@Injectable()
export class DataService {
  patientDatabase = new PatientDatabase();
  problemDatabase = new ExampleDatabase();
  contentDatabase = new ExampleDatabase();
  transXtoH = new TransformXMLtoHTML();
  sampleContent =  new SampleOrderSetXML();


  dataState = DataState.Start;
  dataStatePatientProgress=DataState.PatientSearch_ProgressEnd;
  dataStateProblemProgress=DataState.PatientSelected_ProgressEnd;
  dataSynthetic = true;
  cernerURL ='https://fhir-open.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/';
  aPIKey = zynx_config.aPIKey;
  aPIURL = zynx_config.aPIURL;
  cernerState=false;
  smartFhirApiUrl= config.smartFhirApiUrl;
  smartFhirId="";
  smartFhirState=false;
  smartFhirToken="";
  zynxState=true;


  constructor(private http: HttpClient){
  }

  getCernerURL(){ return this.cernerURL; }

  setCernerURL(val:string) {this.cernerURL=val;}

  getAPIKey() { return this.aPIKey; }

  setAPIKey(val:string) {this.aPIKey=val;}

  getAPIURL() { return this.aPIURL; }

  setAPIURL(val:string) {this.aPIURL=val;}

  getCernerState() { return this.cernerState; }

  setCernerState(val:boolean) {this.cernerState=val;}

  getZynxState() { return this.zynxState; }

  setZynxState(val:boolean) {this.zynxState=val;}

  // TODO: Switching the main toggle off should set Cerner and Zynx State to false.

  inStateStart(){
    return (this.dataState===DataState.Start);
  }

  inStatePatientSearch(){
    return (this.dataState===DataState.PatientSearch);
  }

  inStatePatientSearchStart(){
    return (this.dataStatePatientProgress===DataState.PatientSearch_ProgressStart);
  }

  inStateProblemSearchStart(){
    return (this.dataStateProblemProgress===DataState.PatientSelected_ProgressStart);
  }

  inStatePatientSelected(){
    return (this.dataState===DataState.PatientSelected);
  }

  inStateProblemSelected(){
    return (this.dataState===DataState.ProblemSelected);
  }

  inStateContentSelected(){
    return (this.dataState===DataState.ContentSelected);
  }

  getDataSource() {
     return new PatientDataSource(this.patientDatabase);
  }

  getProblemDataSource(sort:MdSort) {
     return new ExampleDataSource(this.problemDatabase);
  }

  getContentDataSource(sort:MdSort) {
     return new ExampleDataSource(this.contentDatabase);
  }


  searchByName(name:string) {
     this.dataState=DataState.PatientSearch;
     this.dataStatePatientProgress=DataState.PatientSearch_ProgressStart;
     if(this.getCernerState())
     {
        this.patientDatabase.clearData();
        this.http.get<any> (this.getCernerURL()+"Patient?name="+name+"*").subscribe(data => {
          let dataLength=data.entry.length
      	  for (let i = 0; i < 6 && i < dataLength; i++) {
      	    this.patientDatabase.addName(data.entry[i].resource.name[0].text,data.entry[i].resource.id);
      	  }
          this.dataStatePatientProgress=DataState.PatientSearch_ProgressEnd;
        });
     }
     else
     {
       this.patientDatabase.addRandomName(name);
       this.dataStatePatientProgress=DataState.PatientSearch_ProgressEnd;
     }
  }

  clearUnSelectedNames(name:string) {
     this.patientDatabase.clearUnSelectedNames(name);
     this.dataState=DataState.PatientSelected
     this.dataStateProblemProgress=DataState.PatientSelected_ProgressStart;
     if(this.getCernerState())
     {
       this.problemDatabase.clearData();
       let patientId="not found";
       let slicedData=this.patientDatabase.data.slice();
       let patientDataLength=slicedData.length;
       for(let i = 0; i < patientDataLength; i++){
         if(slicedData[i].name===name)
         {
            patientId=slicedData[i].id;
         }
       }
       if(patientId!=="not found"){
	       this.http.get<any> (this.getCernerURL()+"Condition?patient="+patientId).subscribe(data => {
                  console.log("Retreived data for problems from Cerner Sandbox.");
		  let dataLength=data.entry.length
		  for (let i = 0; i < 6 && i < dataLength; i++) {
                    if(data.entry[i].resource.code!==null){
		      this.problemDatabase.addProblem(data.entry[i].resource.code.text);
                    }
		  }
          // Forces the addition of Ashtma to patient for Demo
          this.problemDatabase.addProblem("Asthma");
          this.dataStateProblemProgress=DataState.PatientSelected_ProgressEnd;
	       });
       }
       else
       {
          this.dataStateProblemProgress=DataState.PatientSelected_ProgressEnd;
       }
     }
     else if(this.smartFhirState)
     {
       this.problemDatabase.clearData();
       this.http.get(
         this.smartFhirApiUrl + "Condition?patient=Patient/" + this.smartFhirId,
         {
           responseType: 'json',
           headers: new HttpHeaders()
             .set('Authorization', 'Bearer ' + this.smartFhirToken)
             .set('Accept', "application/json")
         }
       ).subscribe(data => {
          let dataLength = data["entry"].length
   		    for (let i = 0; i < 6 && i < dataLength; i++) {
            if(data["entry"][i].resource.code!==null){
   		         this.problemDatabase.addProblem(data["entry"][i].resource.code.text);
            }
   		     }
       })
       this.problemDatabase.addProblem("Asthma");
       this.dataStateProblemProgress=DataState.PatientSelected_ProgressEnd;
     }
     else
     {
       this.problemDatabase.getProblems(name);
       this.dataStateProblemProgress=DataState.PatientSelected_ProgressEnd;
     }
  }

  clearUnSelectedProblems(name:string) {
     this.problemDatabase.clearUnSelectedNames(name);
     this.contentDatabase.getContent(name);
     this.dataState=DataState.ProblemSelected
  }

  htmlContent="No Content Selected.";
  rawContent= "No Content Selected.";

  clearUnSelectedContent(name:string) {
     this.contentDatabase.clearUnSelectedNames(name);
       if (this.zynxState===true) {
	 this.http.get(this.getAPIURL()+"c1d06f95-c9f4-436d-ae8b-4de9c141867b",{ responseType: 'text',
              headers: new HttpHeaders({'Accept':'application/xml'}).set('Authorization','Bearer ' + this.getAPIKey())})
           .subscribe(data => {
           //console.log("Retreived data for content from Zynx.");
           this.htmlContent=this.transXtoH.transform(data,'os');
           this.rawContent = data
           console.log(this.htmlContent);
         });
       }
       else {
          let localSampleContent=this.sampleContent.getSampleOrderSetXML();
          this.htmlContent=this.transXtoH.transform(localSampleContent,'os');
          this.rawContent = localSampleContent
       }
     this.dataState=DataState.ContentSelected
  }

  getRawContentSelected(name:string) {
     return this.rawContent;
  }

  getContentSelected(name:string) {
     return this.htmlContent;
  }

}

/** Constants used to fill up our data base. */
const NAMES = ['Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack',
  'Charlotte', 'Theodore', 'Isla', 'Oliver', 'Isabella', 'Jasper',
  'Cora', 'Levi', 'Violet', 'Arthur', 'Mia', 'Thomas', 'Elizabeth'];

const PROBLEM_NAMES = ['Asthma','Heart Failure','Diabetes'];

const CONTENT_NAMES = ['Asthma - Admission to ICU','Ashtma - Admission Med/Surg','Asthma - Discharge'];

export interface PatientData {
  name: string;
  id: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class PatientDatabase {

  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<PatientData[]> = new BehaviorSubject<PatientData[]>([]);
  get data(): PatientData[] { return this.dataChange.value; }

  constructor() {
  }

  clearData(){
     this.dataChange.next([]);
  }

  addName(nameVal:string,idVal:string){
    const copiedData = this.data.slice();
    copiedData.push({name:nameVal, id:idVal});
    this.dataChange.next(copiedData);
  }

  addRandomName(nameVal:string){
    this.dataChange.next([]);
    for (let i = 0; i < 6; i++) { this.addUserStartsWith(nameVal); }
  }

  clearUnSelectedNames(nameVal:string){
    const copiedData = this.data.slice();
    for (var i = 0; i < copiedData.length; i++) {
      if (copiedData[i].name===nameVal){
        this.dataChange.next([{name:copiedData[i].name,id: copiedData[i].id}]);
        console.log("Set next to :" +nameVal);
        break;
      }
    }
  }

  /** Adds a new user to the database. */
  addUserStartsWith(name:string) {
    const copiedData = this.data.slice();
    copiedData.push(this.createNewUser(name));
    this.dataChange.next(copiedData);
  }

  /** Builds and returns a new User. */
  private createNewUser(nameVal:string) {
    const name =
        nameVal + ' ' +
        NAMES[Math.round(Math.random() * (NAMES.length - 1))];
    return {
      name: name, id:"not set"
    };
  }

}

export class PatientDataSource extends DataSource<any> {

  constructor(private _patientDatabase: PatientDatabase) {
    super();
  }

  connect(): Observable<PatientData[]> {
    const displayDataChanges = [
      this._patientDatabase.dataChange
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      return this._patientDatabase.data.slice();
    });
  }

  disconnect() {}
}


export interface UserData {
  name: string;
}


/** An example database that the data source uses to retrieve data for the table. */
export class ExampleDatabase {

  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<UserData[]> = new BehaviorSubject<UserData[]>([]);
  get data(): UserData[] { return this.dataChange.value; }

  constructor() {
  }

  clearData(){
     this.dataChange.next([]);
  }

  addName(nameVal:string){
    const copiedData = this.data.slice();
    copiedData.push({name:nameVal});
    this.dataChange.next(copiedData);
  }

  addRandomName(nameVal:string){
    this.dataChange.next([]);
    for (let i = 0; i < 6; i++) { this.addUserStartsWith(nameVal); }
  }

  clearUnSelectedNames(nameVal:string){
    const copiedData = this.data.slice();
    for (var i = 0; i < copiedData.length; i++) {
      if (copiedData[i].name===nameVal){
        this.dataChange.next([{name:nameVal}]);
        console.log("Set next to :" +nameVal);
        break;
      }
    }
  }

  /** Adds a new user to the database. */
  addUserStartsWith(name:string) {
    const copiedData = this.data.slice();
    copiedData.push(this.createNewUser(name));
    this.dataChange.next(copiedData);
  }

  /** Builds and returns a new User. */
  private createNewUser(nameVal:string) {
    const name =
        nameVal + ' ' +
        NAMES[Math.round(Math.random() * (NAMES.length - 1))];
    return {
      name: name
    };
  }

  getProblems(name:string) {
    this.dataChange.next([]);
    for (let i = 0; i < 3; i++) { this.addProblem(PROBLEM_NAMES[i]); }
  }

  addProblem(nameVal:string) {
    const copiedData = this.data.slice();
    copiedData.push({name:nameVal});
    this.dataChange.next(copiedData);
  }

  getContent(name:string) {
    this.dataChange.next([]);
    for (let i = 0; i < 3; i++) { this.addContent(i); }
  }

  addContent(num:number) {
    const copiedData = this.data.slice();
    copiedData.push({name:CONTENT_NAMES[num]});
    this.dataChange.next(copiedData);
  }

}

export class ExampleDataSource extends DataSource<any> {

  constructor(private _exampleDatabase: ExampleDatabase) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<UserData[]> {
    const displayDataChanges = [
      this._exampleDatabase.dataChange
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      return this._exampleDatabase.data.slice();
    });
  }

  disconnect() {}
}

export class TransformXMLtoHTML {
  XSLprovider = new XSLFile();
  XSLRemoveNamespace = new XSLFileRemoveNamespace();

  removeNameSpace(xmlNSDoc) : Node {
    let xsltText = this.XSLRemoveNamespace.getXSLFileRemoveNamespace();
    let domParser = new DOMParser();
    let xsltDoc = domParser.parseFromString(xsltText, "text/xml");
    let processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    let resultDoc = processor.transformToDocument(xmlNSDoc);
    return resultDoc;

  }

  transform(xml:string,typeContent:string): string {
    let domParser = new DOMParser();
    let contentDoc = domParser.parseFromString(xml, "text/xml");
    let xmlRemoveNSDoc = this.removeNameSpace(contentDoc);
    let xsltText =   this.XSLprovider.getXSL(typeContent);
    let xsltDoc = domParser.parseFromString(xsltText, "text/xml");
    let processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    let resultDoc = processor.transformToDocument(xmlRemoveNSDoc);
    let serializer = new XMLSerializer();
    let strHtml = serializer.serializeToString(resultDoc);
    return strHtml;
  }

  transformJson(contentDoc:Node,typeContent:string): string {
    let domParser = new DOMParser();
    let xsltText =   this.XSLprovider.getXSL(typeContent);
    let xsltDoc = domParser.parseFromString(xsltText, "text/xml");
    let processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    let resultDoc = processor.transformToDocument(contentDoc);
    let serializer = new XMLSerializer();
    let strHtml = serializer.serializeToString(resultDoc);
    return strHtml;
  }

}

export class SampleOrderSetXML {

  mySampleOrderSetXML=`
  <PlanDefinition xmlns="http://hl7.org/fhir"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:schemaLocation="http://hl7.org/fhir https://www.hl7.org/fhir/plandefintion.xsd">
     <id value="9a43c197-bcb3-4397-b521-336eefe088d3"/>
     <identifier>
        <use value="temp"/>
        <system value="http://www.zynxhealth.com/codings/as/id"/>
        <value value="757"/>
     </identifier>
     <version value="1.0.0"/>
     <name value="abdominal-aortic-aneurysm-repair-discharge"/>
     <title value="Abdominal Aortic Aneurysm Repair - Discharge"/>
     <type id="order-set"/>
     <status value="draft"/>
     <date value="2017-09-08T18:19:57.156"/>
     <useContext>
        <code>
           <system value="http://hl7.org/fhir/usage-context-type"/>
           <code value="focus"/>
        </code>
        <valueCodeableConcept>
           <coding>
              <system value="http://www.zynxhealth.com/codings/sct"/>
              <code value=""/>
              <display value=""/>
           </coding>
        </valueCodeableConcept>
     </useContext>
     <useContext>
        <code>
           <system value="http://hl7.org/fhir/usage-context-type"/>
           <code value="venue"/>
        </code>
        <valueCodeableConcept>
           <coding>
              <system value="http://www.zynxhealth.com/codings/sct"/>
              <code value=""/>
              <display value=""/>
           </coding>
        </valueCodeableConcept>
     </useContext>
     <publisher value="Zynx Health"/>
     <contact>
        <telecom>
           <system value="url"/>
           <value value="http://www.zynxhealth.com"/>
        </telecom>
        <telecom>
           <system value="email"/>
           <value value="support@zynx.com"/>
        </telecom>
     </contact>
     <copyright value="© Copyright 2017 Zynx Health Corporation. All rights reserved."/>
     <action>
        <title value="Medications"/>
        <code>
           <coding>
              <system value="http://www.zynxhealth.com/codings/as/item-types"/>
              <code value="2"/>
           </coding>
           <text value="Section"/>
        </code>
        <groupingBehavior value="logical-group"/>
        <action>
           <title value="Analgesics: Combination Agents"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <groupingBehavior value="logical-group"/>
           <action>
              <textEquivalent value="acetaminophen-codeine 300 mg-30 mg tab"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="1 tablet orally every 4 hours as needed for pain"/>
              </action>
           </action>
           <action>
              <textEquivalent value="HYDROcodone-acetaminophen 5 mg-325 mg tab"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="1 tablet orally every 4 hours as needed for pain"/>
              </action>
           </action>
           <action>
              <textEquivalent value="oxyCODONE-acetaminophen 5 mg-325 mg tab"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="1 tablet orally every 4 hours as needed for pain"/>
              </action>
           </action>
        </action>
        <action>
           <title value="Analgesics: Non-opioids"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <groupingBehavior value="logical-group"/>
           <action>
              <textEquivalent value="acetaminophen"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="650 milligram orally every 6 hours as needed for pain"/>
              </action>
           </action>
        </action>
        <action>
           <title value="Beta-Blockers"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <documentation>
              <type value="justification"/>
              <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Beta-Blockers"/>
              <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=1661"/>
           </documentation>
           <groupingBehavior value="logical-group"/>
           <action>
              <title value="For patients at high cardiac risk due to the presence of clinical risk factors, perioperative beta-blockers should be used"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="4"/>
                 </coding>
                 <text value="Reminder"/>
              </code>
              <documentation>
                 <type value="justification"/>
                 <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Beta-Blockers"/>
                 <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=1661"/>
              </documentation>
           </action>
           <action>
              <title value="For patients who are currently on beta-blocker therapy, beta-blockers should be continued during the perioperative period"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="4"/>
                 </coding>
                 <text value="Reminder"/>
              </code>
              <documentation>
                 <type value="justification"/>
                 <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Beta-Blockers"/>
                 <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=1661"/>
              </documentation>
           </action>
           <action>
              <textEquivalent value="bisoprolol"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="5 milligram orally once a day ; maintain heart rate between 50 to 60 beats per minute; start at least 1 week prior to surgery and continue for 30 days after surgery"/>
              </action>
              <action>
                 <textEquivalent value="10 milligram orally once a day ; maintain heart rate between 50 to 60 beats per minute; start at least 1 week prior to surgery and continue for 30 days after surgery"/>
              </action>
           </action>
           <action>
              <textEquivalent value="metoprolol succinate ER 50 mg tablet,extended release 24 hr"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="50 milligram orally once a day ; maintain heart rate between 55 to 65 beats per minute"/>
              </action>
           </action>
           <action>
              <textEquivalent value="metoprolol succinate ER 100 mg tablet,extended release 24 hr"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="100 milligram orally once a day ; maintain heart rate between 55 to 65 beats per minute"/>
              </action>
           </action>
        </action>
        <action>
           <title value="Laxatives"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <groupingBehavior value="logical-group"/>
           <action>
              <textEquivalent value="docusate sodium"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="100 milligram orally 2 times a day"/>
              </action>
           </action>
           <action>
              <textEquivalent value="senna 8.6 mg tablet"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="17.2 milligram orally once a day, at bedtime"/>
              </action>
           </action>
        </action>
        <action>
           <title value="Platelet Inhibitors: Salicylates"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <groupingBehavior value="logical-group"/>
           <action>
              <textEquivalent value="aspirin"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="3"/>
                 </coding>
                 <text value="Orderable (Med)"/>
              </code>
              <selectionBehavior value="at-most-one"/>
              <action>
                 <textEquivalent value="81 milligram orally once a day"/>
              </action>
           </action>
        </action>
        <action>
           <title value="Reminders"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="2"/>
              </coding>
              <text value="Section"/>
           </code>
           <groupingBehavior value="logical-group"/>
           <action>
              <title value="Consider statin therapy"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="4"/>
                 </coding>
                 <text value="Reminder"/>
              </code>
              <documentation>
                 <type value="justification"/>
                 <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Dyslipidemia Management"/>
                 <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=19078"/>
              </documentation>
           </action>
           <action>
              <title value="Do not administer ACE inhibitors or ARBs on the morning of surgery; withhold until the patient is euvolemic"/>
              <code>
                 <coding>
                    <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                    <code value="4"/>
                 </coding>
                 <text value="Reminder"/>
              </code>
              <documentation>
                 <type value="justification"/>
                 <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Hypertension Management"/>
                 <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=189318"/>
              </documentation>
           </action>
        </action>
     </action>
     <action>
        <title value="Laboratory"/>
        <code>
           <coding>
              <system value="http://www.zynxhealth.com/codings/as/item-types"/>
              <code value="2"/>
           </coding>
           <text value="Section"/>
        </code>
        <groupingBehavior value="logical-group"/>
        <action>
           <title value="Lipid panel"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <documentation>
              <type value="justification"/>
              <display value="Abdominal Aortic Aneurysm Repair&gt;Therapy&gt;Medications&gt;Dyslipidemia Management"/>
              <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=19078"/>
           </documentation>
           <selectionBehavior value="any"/>
        </action>
     </action>
     <action>
        <title value="Radiology"/>
        <code>
           <coding>
              <system value="http://www.zynxhealth.com/codings/as/item-types"/>
              <code value="2"/>
           </coding>
           <text value="Section"/>
        </code>
        <groupingBehavior value="logical-group"/>
        <action>
           <title value="CT angiography, abdomen"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <selectionBehavior value="any"/>
        </action>
        <action>
           <title value="CT angiography, pelvis"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <selectionBehavior value="any"/>
        </action>
        <action>
           <title value="CT, abdomen, without contrast"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <documentation>
              <type value="justification"/>
              <display value="Abdominal Aortic Aneurysm Repair&gt;Diagnostics&gt;CT – Abdomen"/>
              <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=197573"/>
           </documentation>
           <selectionBehavior value="any"/>
        </action>
        <action>
           <title value="MRA, abdomen"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <selectionBehavior value="any"/>
        </action>
        <action>
           <title value="MRA, pelvis"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <selectionBehavior value="any"/>
        </action>
        <action>
           <title value="Ultrasound, aorta, duplex, complete"/>
           <code>
              <coding>
                 <system value="http://www.zynxhealth.com/codings/as/item-types"/>
                 <code value="5"/>
              </coding>
              <text value="Orderable"/>
           </code>
           <selectionBehavior value="any"/>
        </action>
     </action>
  </PlanDefinition>
  `;
  
  getSampleOrderSetXML() {
    return this.mySampleOrderSetXML;
  }  
}

export class XSLFile {

  myOrdersetXSLFile=`<?xml version="1.0" encoding="UTF-8"?>
  <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xpath-default-namespace="http://hl7.org/fhir">
      <xsl:template match="PlanDefinition">
          <html xmlns="http://www.w3.org/1999/xhtml">
              <head>
              <style type="text/css">
                  table{
                    table-layout: fixed;  
                    border-collapse: separate;
                  }
                  table,
                  td{
                      vertical-align: text-top;
                      font-size: 16px;
                      word-wrap: break-word;
                      white-space: pre-wrap; 
                  }
                  td#section{
                      color: #43609c;
                      font-weight: bold;
                  }
                  td#sub-section{
                  
                      color: #000000;
                      left: 100px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                  }
                  td#medication{
                      padding-left:40px;
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                  }
                  td#med-detail{
                      padding-left:60px;
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                      word-wrap:break-word
                  }
  
                  body {
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                  }
  
                  h1{
                      color: #43609c;
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                      font-size: 20px;
                  }
  
                  h2{
                      color: #43609c;
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                      font-size: 20px;
                  }
  
                  .checkbox {
                      
                      outline: 1px solid #3383FF;
                      border-radius:1px;
                  }
                  .no-checkbox {
                      font-weight: bold;
                      font-style: italic;
                  }
                  .actionDefinition {
                      font-size: 20px;
                      font-weight: bold;
                  }
                  .url-icon {
                      text-decoration: none;
                  }
                  .spacing {
                      padding-left: 8px;
                  }
                  .Section {
                      font-weight: bold;
                      font-style: italic;
                      padding-left: 20px;
                  }
                  .Reminder {
                      
                  }
                  .panel{
                      background-color:#FAF0E1;
                      border:2px solid;
                      border-radius:4px;
                      align:left
                      box-shadow:0 1px 1px rgba(0,0,0,.05);
                      margin-top:16px;
                      margin-bottom:16px
                  }
                  .rightpic{
                      position: absolute;
                      top: 8px;
                      right: 16px;
                      font-size: 18px;
                  }
                  .logo{
                       align=right;
                       padding-right: 2px;
                       height : 50px;
                       width: 120px;
                      
                  }
              </style>
              <title>
                   <xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"/>
              </title>
              </head>
              <body>
                  <table cellspacing="0" cellpadding="0" border="0" width="100%">
                       <tr> 
                          <td>
                              <h1><xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"/></h1>
                              <h2> Version : <xsl:value-of select="version/@value"/></h2>
                              <h2><xsl:value-of select="date/@value"/></h2>	
                          </td>
                      </tr>
                      <tr>
                          <td>
                              <table border="0" width="100%">
                              <xsl:for-each select="action">
                              <tr>
                                <td id="section" class="panel"><xsl:value-of select="title/@value"/></td>
                              </tr>
                              <xsl:for-each select="action">
                                  <xsl:variable name="selection" select="selectionBehavior/@value"/>
                                  <xsl:variable name="ADDtitle" select="title/@value"/>
                                  <xsl:variable name="textEquivalent" select="textEquivalent/@value"/>
                                  <xsl:variable name="displayValue" select="documentation/display/@value"/>
                                  <xsl:variable name="urlValue" select="documentation/url/@value"/>
                                  <xsl:variable name="itemType" select="code/text/@value"/>
                                  <xsl:variable name="child" select="count(action)"/>
                                  <tr>
                                      <td id="sub-section">	
                                          <table cellpadding="0" cellspacing="4"  border="0">
                                              <tr width="12%" nowrap="1">
                                                  <td>
                                                      <xsl:choose>
                                                          <xsl:when test="$selection !='' and $child =0">
                                                              <span>
                                                                  <input class="checkbox" type="checkbox"></input>
                                                              </span>
                                                              <xsl:if test="$ADDtitle !=''">
                                                                  <span class="spacing">
                                                                      <xsl:value-of select="$ADDtitle"/>
                                                                  </span>
                                                              </xsl:if>
                                                              <xsl:if test="$textEquivalent !=''">
                                                                  <xsl:value-of select="$textEquivalent"/>
                                                              </xsl:if>
                                                          </xsl:when>
                                                      <xsl:otherwise>
                                                           <xsl:if test="$ADDtitle !=''">
                                                              <span class="{$itemType}">
                                                                  <xsl:value-of select="$ADDtitle"/>
                                                              </span>
                                                          </xsl:if>
                                                          <xsl:if test="$textEquivalent !=''">
                                                              <span>
                                                                  <xsl:value-of select="$textEquivalent"/>
                                                              </span>
                                                          </xsl:if>
                                                          </xsl:otherwise>
                                                      </xsl:choose>
                                                      <xsl:if test="$urlValue !=''">
                                                      <span class="spacing">
                                                      <a href="{$urlValue}" class="url-icon" target="_blank" title="{$displayValue}">
                                                       <img border="0" alt="Z" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAoCAYAAAB0HkOaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAA1PSURBVFhH7ZdnXJVXtsb5djNzE3sUO4IClpnctEmdlDsmMdbYG0ajYkGa2BWY2OjFAgioFOlw6AgqHUEpooAikCACFsAKiDTR/13vi87EuXFy59v9MOv3e3jfszl7nWevtddez9bi/5H9m8yr7N9kXmX/Eplnz57xpOcpnd1PaOvoovVxp4qW58+2jm75X4/6Hfnqv2y/SUYh8PTpM7rlB1rbu7hxt5XCqlvE5V0lKPUiJ1KLCTxTTHDaRZIKqrjw022u3X7Ao/Zuup88VecqPv4v9k/JPBFHrRKBG3eaKatpIKeshvjzlRw/U4Kz5hx7QnPYE5LD7pBs9sq7a0w+fqmlaHLLyS6t4fL1Bm7K3GaJWvdTidZzv6+yV5LpkdW0tHVSXttERGYJP55IZbVrDHP2RDLFNorJ1hq+3BX9EpSxb20jmb07nBXOkdj6pxCVVcLlaw08fNRBT88/p/O/yDwVKHlvuN9KQUU9ETlX2BGYycw9Gt42D0R3tT86xsHorotEz0TzEsasC2e0cRBj1/jxxw3Hmb47EuugHALTSskrr6O+sZk2SV+PRPzX7CUySmrbu3q4ea+V9EvV7AtJ43uXWCbbaHhnczSGlgnoWpxCd2MaY60yGbs5S5D9HPJulYGuZSp6FifRN4/h7c0aJtvGYOQcz97gDGLPllJV18Tjzu7nv/iy/Y2MwrVLNumtuy1kCJGD8eclJWH8Yb0v49bJas0SGLc5E/3t+RjsLOrFrgsYWBf3QnlXxnYUor81V4gJKdM4dNeGSESDmLNXg23AaRJyy6htuEdHVzdP/2Fjq2SUsSeSz/ut7Zy7UiurSGOBXSTvmEtKVvkzeq0GXfPTQuZsL5kdz8nsVAi8gEJEsL0A/S156EnkdEyTGWEche6aYN42O8FM2xB+9D9F8rkyam420d7ZpZJ4YSoZJYfNjzu4UttISEYZ8/eGMcHYE52VxxhlHIaOSaKQSZX0ZKG3KUdwFr3NuegpP/oCymcZ17XKllRlMsY8TcikMGpdPCNXhzFq+THeWufLwr2hOIWeIb2wnDv3m3kmVfbCVDJdT3q41nAfTc5ldgVm8LGVH8OWHGLoMj9GrgpHRxzqbEhhtOlpRpmeEaQyyiyN0ebpgozep3xWxzfId0yExPqTQiSBkcYxDPshBO0lvugs8+QDMx+W24XgHZPJ1ep62tsfy1nUS0gl0yYbKr+ijt1BacySshxv7MPgRZ5oG/kxfEWoEJJQC6E/WKXwwc50PrHJ5BPbLEG2IEd9fmyTxUfWmXy4K1027in01sczYlUkw2T+0GUBDFnsw9BFh9BZ6sanZh5sPxJLRkEZtxoa6ezq7CWjnCd3Wh6TeP4q3ztGMGmNJyOWHGbQfE8GLz7K4CXiaFkQk0xjWOImB1zUFdySflLh+hzOiT/hGF/Zi7irmB0r5MOtiQxbHsSbi/1lYb68Od+LQXMPCBwxXOGC0d5A/OIyKC6r4GFLay+ZTklRtRzfAXKkf7PtOEPmOzBwthsD5iiEvBgw35sBC3x510IOseBC0ktvU1b7kEs1Dyi+dp+Lgsv1zfzc+IjrTW2CRyTk1/HdvhS0lx6n/9wjDJzrycA5h+j/nZvAkdGLHfnK8jC7PMJISD/H7ab7vWSUflNQeQv3mDw+NvOm74x99JnuRL9ZBxgw+yD9Z4uTOR5MWBOA8YEzeCeVEJFVQWhGhfSlcsIzK8i7cpOHclorppRrSfUdljgkM2ThEd4QP30F/Wa602+GizwdGDbPnvdXO7Nyty/HY1Kprr1Jd3cXWo0PHxErTc8mIJX31nvSd/peXp/mQB+Z2H+GK/1nymrEmfZ8IbTqOB9ZBPGZVWgvNoXx3e44XKKKpDk+VIkonTunrJ55e2IZPPeg+HKWxbmIX+XpKIu1Z8hsOyYtd2TONg9cAuO5UFrBvXt30aptesjR5EIsvRJ5a81hmbSP16faixNH+iiQKPVRHTmrjn831Yn/mCJjM9wwXHlUzqMEfFMuU3+nlRaJcn75TRzCcvnUIkCi4Mx/fis+pjryxlQH1W+faXYMmrUf/SX2fGN5ENsjkaTnFnK9pgatmtv3ORybx4aD8fxxtZCZJmS+3S8QQgopFb2Ofi9jr02x47Vv7Bix8ABL7WKJza2S9tHGI4lIYcUtzA+f4u01Pgyb6yokZK7i52+wEz/7GTBzP3qL7fnSzJ2tB0NITM3mank5WtW37uOuOcs691gmrXpBRpmkkFAgRCRtylMh019Wa/C9B/N+jMQ/5aLaUNu7nnBJ9olTZD7vrD3Ga1/t53dC+sU81c9zMn2EzCAho7vIns83uGHlegJNUhqXLl5E65pE5lBMLiYH4nojM12iMk0mTnNS89xX9k7fma68Ifvn99Nc0F3mzSq3ZBLO/cRtIfK48wn5lQ1sOprNn8yDGbbAg9enu6pzVCjzFT+SciVVfcT3oFl26C1xUCNj5RpARHwKhQX5aNUpe+ZkARaeSbJnPFQyfWWf9FU3rruUolSUlKW2VMZEY38W2SURnH5VTU3z424uVN/DPrKYP1mE8cZsDxVK9Q2ce7i3nJWK/E4qSSEmpPrNcGDwbHsMjBz42lLS5B5AeFwy+efPo6WEOSqnDGu/M1JNXpIGeylFqSJxMnCuOJ4rY3LWTFofgqlXplReNXV3Wrj3qIvsK41sDbzAZzuSGLEiiD7zj9Jv/jEGLjgqUA46bwbO81KJDZh9QBYnC5zphPYcB6kmJ2ZtPoTNoSA0CUpkCtBqlvMh70odbtFKBfjKgecgE93lwDvC4IXyeaE4X+THJ1vi8Eoup7apVRXcD4RM8oWbmPrk883u03xlm8LXtsl8bXNS/e7Y1aEMWerHmzL/zQU+DBJSA9SDz0XOGUfeXe3CUmsPHHxCSUhJo7j4AlqK0K4TkR2cXsKU7f5oL3Bi0ILD0gqOSW8KEARJOwjlC+sUAjKqpXV0qIdbR9dTOblbSSm+QWjONSLP1hB97jrReTU4RpeJIEth5MpQBhudYPBSf2kLSsSOMGCuGyMXOfGZiRumdj74BEeTmpFNWVkpWoq8UQRzSmGV9KZwOdgOM1w2qbaRv9rkhq+MYvjqGP5sk46L9KALNc3U3uug5k4HlQ1tlNa3cKm2mZLaFmkLrYIWwnLrmeOUIzI0lqE/RDJU/GgvC1SbpfaCA4xb5sy0jQewPeBPRGwS+YVFVP/8c2/XVmRgoejdPdK1Z9iEYbhWJMT3/gyXbj1qXRKjRT68syMLIy8R5rHXcEmpwzm5Xp71uJ66gdtpgTzd5el+up7NoZV8sVu0jeiZkWsTGbE6WhYmlWbkg47RQd4zdsNo52FcfYI4dTqVispK7jQ1/ULPSIlrssvY4Z/Bn7cEM2rFcRFWUapa07NMx3DLWd61KeDTfcV8ZneRz+0vqfjCoUTF5w7KZxm3K+bD3QVM3CYCTOaNMT3FqLWxIkUC0VnuxVvGB5m26RBWDtKXgiI4e/Ys9fV1PHrU+nelp1wlFKUXll3OIvtoJqw9yhjjEMZsSFCF9jhRc+O2FTB2W6GKcduLXsLY7b3jelvlO1vzGbf1HGM3ieozE6G1JoKRK3wx/OEgk6UFmOz3xe1oCLHxSRRfKOLO3Sa6lEapkFE1sBBSrqlFciO0EeH87a4g0a1BjNsQyViLFFH/OULmPPqqEC/G0PoShjYlvbBWcEmE+UX5/wX0FVG+TQhtykBvQxx6xgEYyl78aL0by209cPKWco5L5GxuHlVVlbRKVJRbp0rmhfWI/FNuj3Gi4O1CMlm4P4oPNp7AwCRUdHCMaNsz8iO5QqaQ8baXmPDXMib+eIUJCuRdGTPY2Xs70NuYrt4oDExEjJv48BfRL0ZSyjZuRwkMjSJH0lNVVUVj4y+Unvr3uSnsOuRS3yD3pvzyepzD0lmyN4iPzI6gb+wtUjIU/Y3JGGzNwnBnvkSlWCUw3raE8fJuoIxtzUbfUiJpEonh+gDeM/Vm2hZPSY0PDl6i7oLDSTqZQmlpKXdFNrS3t7+sgX/Nmu63kFpwBQ9NBmYHIpixSw4+K3/esghlvIUGA8t4xlmelE2aIlE4xVjLZCGRyETLGP5LWsP75n58udGHeTu8sLD3UfeIJi6BzKwsLkpTvF57nbbHbS/dnV5JpksidOdBC1X1jSTnleIaeoo1TqFM2XKU9zd4MVG08tiVHoxeIVjuga68K2MfyP++2uTNIhsfzOyPseeQP94BoUTHJ5Kbd47q6mo1Im1tbXL37nn+a732SjIvrL2jk5r622ScL8VXk4b1kSiM7QOYb32EqZsO8hdzV/7b1JnJ5s5Mt3Jl8Y5DkhJv/iokPAMjiIpNIDU1VW2EFVev0tjUSEdnh7ol/tF+k4wSRoVQ072HVNbcIL+0kpTsQoLjTuMVFC3hD8VR9oK9hz9Onv64+wbieyKcsOh4TqdlUlRcTKVUzK1bt2huaZaIdwqRv1/cfmm/SUYxZRHKza+jo4MHD+9z/fp1ioqKSEtNIzExEY1GQ0REOOHhYURFRhIfHy/ROENRYaGaloaGhl9Ny8sG/wMkhZI3KoVA/wAAAABJRU5ErkJggg==
  " width="18" height="20" class="url-icon"></img>
                                                      </a>
                                                      </span>
                                                      </xsl:if>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                                  <xsl:for-each select="action">
                                      <xsl:variable name="selection1" select="selectionBehavior/@value"/>
                                      <xsl:variable name="ADDtitle1" select="title/@value"/>
                                      <xsl:variable name="medication" select="textEquivalent/@value"/>
                                      <xsl:variable name="displayValue1" select="documentation/display/@value"/>
                                      <xsl:variable name="urlValue1" select="documentation/url/@value"/>
                                      <xsl:variable name="itemType1" select="code/text/@value"/>
                                      <tr>
                                          <td id="medication">
                                              <table cellpadding="0" cellspacing="5"  border="0">
                                                  <tr>
                                                      <td>
                                                          <xsl:if test="$itemType1 ='Orderable' or not($itemType1)">
                                                          <input type="checkbox" class="checkbox"/>
                                                          </xsl:if>
                                                          <xsl:if test="$ADDtitle1 !=''">
                                                              <xsl:choose>
                                                              <xsl:when test="$itemType1 ='Reminder'">
                                                                  <img border="0" alt="B" src="data:image/png;base64,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
  " width="20" height="22" class="url-icon"></img>
                                                                  <span class="spacing">
                                                                  <span class="Reminder"><xsl:value-of select="$ADDtitle1"/></span>
                                                                  </span>
                                                              </xsl:when>
                                                              <xsl:otherwise>
                                                                  <span><xsl:value-of select="$ADDtitle1"/></span>
                                                              </xsl:otherwise>
                                                              </xsl:choose>
                                                          </xsl:if>
                                                          <xsl:if test="$medication !=''">
                                                          <xsl:value-of select="$medication"/>
                                                          </xsl:if>
                                                          <xsl:if test="$urlValue1 !=''">
                                                          <span class="spacing">
                                                          <a href="{$urlValue1}" class="url-icon" target="_blank" title="{$displayValue1}">
                                                          <img border="0" alt="Z" src="data:image/png;base64,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
  " width="20" height="22" class="url-icon"></img>
                                                          </a>
                                                          </span>
                                                          </xsl:if>
                                                      </td>
                                                  </tr>
                                              </table>
                                           </td>
                                      </tr>
                                      <xsl:for-each select="action">
                                          <xsl:variable name="dosage" select="textEquivalent/@value"/>
                                          <tr>
                                              <td id="med-detail">
                                                  <table cellpadding="0" cellspacing="3" border="0">
                                                      <tr>
                                                          <td width="2%" nowrap="1">
                                                              <xsl:if test="$dosage !=''">
                                                              <input type="checkbox" class="checkbox"></input>
                                                              </xsl:if>	
                                                          </td>
                                                          <td>
                                                              <xsl:if test="$dosage !=''">
                                                              <xsl:value-of select="$dosage"/>
                                                              </xsl:if>
                                                          </td>
                                                      </tr>
                                                  </table>
                                              </td>
                                          </tr>
                                      </xsl:for-each>
                                  </xsl:for-each>
                              </xsl:for-each>
                              </xsl:for-each>
                          </table>
                          </td>
                      </tr>
                  </table>
              </body>
          </html>
      </xsl:template>
  </xsl:stylesheet>
  `;

  myPlanOfCareXSLFile=`<?xml version="1.0" encoding="UTF-8"?>
  <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xpath-default-namespace="http://hl7.org/fhir">
      <xsl:template match="PlanDefinition">
          <html xmlns="http://www.w3.org/1999/xhtml">
              <head>
              <style type="text/css">
                  table{
                      border-collapse: separate;
                  }
                  table,
                  td{
                      vertical-align: text-top;
                      font-size: 16px;
                  }
                  td#activity{
                      color: #43609c;
                      font-weight: bold;
                  }
                  td#goals{
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 16px;
                  }
                  td#actions{
                      color: #000000;
                      font-weight: bold;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                      padding-left: 20px;
                  }
                  td#actions-normal{
                      font-weight: bold;
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                      padding-left: 0px;
                  }
                  td#actions-detail{
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                      padding-left: 50px;
                  }
                  td#detail{
                      color: #000000;
                      left: 85px;
                      top: 458px;
                      word-spacing: -0.3px;
                      font-size: 14px;
                      padding-left: 80px;
                  }
                  
                  body {
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                  }
                  h1{
                      color: #43609c;
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                      font-size: 20px;
                  }
                  h2{
                      color: #43609c;
                      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
                      font-size: 20px;
                  }
                  .checkbox {
                      outline: 1px solid #3383FF;
                      border-radius:1px;
                  }
                  .no-checkbox {
                      font-weight: bold;
                      font-size: 16px;
                      
                  }
                  .actionDefinition {
                      font-size: 20px;
                      font-weight: bold;
                  }
                  .url-icon {
                      border-radius:50%				
                      text-decoration: none;
                  }
                  .spacing {
                      padding-left: 20px;
                  }
                  .logo{
                       align=right;
                       padding-right: 2px;
                       height : 50px;
                       width: 120px;
                      
                  }
                  .panel{
                      background-color:#FAF0E1;
                      border:2px solid;
                      border-radius:4px;
                      align:left
                      box-shadow:0 1px 1px rgba(0,0,0,.05);
                      margin-top:16px;
                      margin-bottom:16px
                  }
              </style>
                  <title>
                      <xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"
                      /></title>
              </head>
              <body>
                  <table border="0" width="100%">
                     <tr> 
                        <td align="right" width="100%">
                              <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAcFBQYFBAcGBQYIBwcIChELCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGi
                                        AvMy8qMicqKyr/2wBDAQcICAoJChQLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/wAARCABWAX4DASIAAhEBAxE
                                        B/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcY
                                        GRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW1
                                        9jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMo
                                        EIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKm
                                        qsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6RooooAKKjluIYMefLHHnpvYDP508MGUFSCDyCO9AC0UUUAFF
                                        FFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUANkcRxs7dFBJrzn4peP9
                                        R0CS08O+E4GufEGoruQRx+YYU5G4L3JwcZ4ABJrutal8nRbqQfwxk1g+H9Dhh8W+JPEt6ii5ubgQRSP/wAsoIo0XAJ6ZYMT+Fb0uWPvyV/L7jGbbfInb+meNp8CfG3iA/
                                        bvEOpWqXMnJF5cPPKPqQCPyJp8Gk/Ef4OTC/T/AImOixkfaIoJjJBt75UgNGf9sDA4ySOK+hbW/tL0MbO5hnC/e8qQNj8qndVkQo6hlYYIIyCPSt3jKnwzSt2Mlh4W5oP
                                        XuZ2ha9ZeIdDsdV09y1vex70zjKnupx3BBB9wa0q4XwppqeG9Uu9EtQUso9YkktU6BI5LYSFB7B2IFd1XLUiovTZm9OTknfoFFFFZmgUUUUAFFFFABRRRQAUUUUAFFFFA
                                        BRRRQAUUUUAFcT411a/0/VYI7K6khRodxVe53Gu2rz34g/8AIatv+vf/ANmNdmCipVkmjz8xlKOHbi7bGv4H1K81Fb77dcPP5Zj27u2d2f5V1dcV8O/u6j9Y/wD2au1qc
                                        Wkq8kv60LwEnLDRbd9/zYUUUVynaFFFFABRRRQAUUUUAFFFFAFLVtTi0jT2vJ0d0UgFY8Z5OO9Zml+MbPVtRjs4Le4R5M4ZwuBgZ7H2o8bf8ivN/vp/6EK4/wAG/wDI1W
                                        v0f/0A16FGhCeHlUe6v+R5WIxVSnioUo7O35nqFFNkcRxO55CqSce1cLP49uri4jjsbaOBGYAtId7dfwA/WuWlQnVvy9Dtr4mnQtzvc7ysTWvFNpol4ltcwTyM0YkBjC4
                                        xkjuR6Vt1538QP+Q9D/17L/6E1aYWnGrU5ZbGWNrTo0eeG52ei61Drlo9xbRyRqkhjIkAznAPYn1rRrlfh9/yA7j/AK+j/wCgLXVVnXgoVHGOxrhqkqlGM5bsKxL/AMWa
                                        fp2uQ6TcQ35upz+68uxldH4BJDhcEDIyc8d626y9R0QX+tafqQuGiexjnRVC5DeYoGfw21nHlv7xtK9tDNt/iF4burWwngvmdNQuxZwAQvuMuQMEYyo+ZOTx8y+orpq4K
                                        x+FVjYXFvLFqExMC2ZVSg2h4GhLOBngyC3iB9Nveu9q6ipr4GKHPb3ijrcPn6DfRDq1u+PrtNc5rFydQ+Hq3UB+/wCWZ/cghW/8eA/KuwZQylWGQRgivPNH1NPD+pXmj6
                                        opNi7sjbhnb2zj0IxXRhk5K61cWn/mcOMkoySk7KSav2fT9TnLS7nsbpLi1kMcqHKsP5e49q9b0m/Gp6Tb3irt81MsvoehH5g1xt14FknkE2jXkElrJyvmMeB7EA5rbkv
                                        7PwhoMVo0onuEU7YwcF2JySR2GTXTipQrqKp6yOPAwq4ZydXSP6+Q93jn8dRQQjBt7d5pSO7sFUZ99oFdBXH+Bo5rqa/1W6y0kzhAx792x7fd/KuwrhxEVCfJ2R6eFk5w
                                        dR/ad/0X5Hx/rTeLv+Eg1Hyjrvl/a5dmwzYxvOMY7VT3eMf72v8A5z19mV4v8aPikdMjl8L+HZ8Xki4vbmNuYFP/ACzUj+Ijqew9zx30cVKpJQjA56uHUE5OR4Wdf1oHB
                                        1fUAe+bqT/GvXvClpqniP8AZ51t4b+7OoWl9JcwSmdy/wC7jjYqCDnldwA6ZNea+BfBV/448RR6dZAx26Ye6udvywR+vuT0A7n2BI+udF0Sw8P6JbaVpcCw2lumxE9fUn
                                        1JOST3JNXjK0YWit9ycLTlO8nsfHuleL9b0vV7PUF1K9nNrOk3lSXLlZNpB2nnocY/Gvsuzu4b+xgu7VxJBcRrLG46MrDIP5Gvjnx34ePhfxzqmkqCIoZi0GRjMbDcn5A
                                        gfUGvob4G6/8A2z8Nre1kcGfS5GtWGedg+ZDj02kD/gJqMdBSpxqR/q5WEk4zdORH8dPEsmg+AfstnM0V3qU6wo8blXRF+dmBHPYL/wACryP4SQ6x4n+ItjDcanqElnZ5
                                        u7gG6fBCfdB55BcqCO4zVv4+69/anj9NNjYGHSoBHwc/vHw7fpsH4V337Pfhz+z/AAjda5Mo83U5dsR7iKMlf1bf+QoVqOEv1f6/8AG3VxNuiOT/AGgNU1Cy8eWMdlf3V
                                        sh05GKwzsgJ8yTnANclo/xQ1/RPCN1pOnXdwb28ud7XkshkeKPaoCx5zgk557duTkdH+0V/yUCw/wCwYn/o2Snfs++G7bVvFd7q94iyDSo0MKMucSyE4f8A4CEb8SD2ra
                                        HJHCqUlexnLnliHGLOE1bwz4uW1k1fXNJ1YxH55Lq6ic4z3YtyPqaveBviLrPgrVIXguZZ9NLj7RYuxZHXuVB+62OhHfrkcV9dyxRzwvFMiyRyKVdGGQwPBBFfEmt2cen
                                        eINRsYc+Xa3csCZ9FcqP5UYessSnCaCtSdBqUWfaE8Np4g0Fo/MdrS+g4kico2xhkMrDkHByDXyX4ug8S+EPE93o9/rGoM0LZil+0yATRn7rjnuPyII7V9LfC6Z5/hb4f
                                        eQlmFmqZPouVH6AVi/GPwF/wl3hk3unxbtW01S8IUczR9Wj9z3HuMdzXDhqio1XCWx114OrTUluV/gn46PifwwdK1GYvqmmKEZnbLTQ9Ff1JH3SfoT1rh/jl8Qbi58QR+
                                        HtDvZYYdPO66lgkKl5iPu5U9FB/Mn0ry7w14k1Hwprceq6PL5dwisnPKurDBDDuOhx6gHtVnwr4cv8Axv4ug02B3aW6kMlzcPltiZy8jH1+vUkDvXesLCnVdV7HG68p01
                                        TW56x8CfD+rapdyeJtZv76WzgJis4pbhyssnRnIJwQvQe+f7tdr8Qf+Q1bf9e//sxrttJ0u00XSbbTdOiENraxiONB2A/mT1J7muI+IP8AyGrb/r3/APZjXLh6vtcVzDx
                                        1P2eE5fQydK12fSLG7is/lmuCgEhGdgG7OPfkVFd6fqzxteX1tdspGWllVjx6nPStfwLpyXesSXMyBltVBUHs5PB/AA/pXorKGUqwBBGCCOtbV8TGhVajHXqceGwcsTRT
                                        nKy6I8m0fXrzRrlWhkZ4M/PAzfKw749D716vBMlxbxzRHdHIoZT6gjIrx7UIRbandQIMLFM6KPYMQK9I0K58jwXb3D8iG3ZvwXP+FRjqcWozjuzTLKsoylTk9EY/ivxXL
                                        b3D6fpb7GTiaYdQf7o/qa5W30zVNX3TQW891zzIxzk/U1U3Ga43XEhzI+ZJDyeTyf616Tb+KfD1rbRwQXeyONQqqIX4A/CtpJ4aCjSjdnPBxxlRyrT5V0Vzgkm1XQbvaG
                                        ns5RzsPAYfToRXonhrXV1zTyzhUuYiFlQdPYj2P9DXP+LdZ0bV9JUWtx5lzE4aMeWw4PDDJHpz+FZ3ga5MHiMRZO2eNlI9SPmH8j+dZ1Ye3oOco2kjShU+rYlUoS5os6n
                                        xpf3Wn6LHJZTNC7zhGZQM7drH8Ogrh00zWtW/fC3urkN0kkJwfoWNeo3sVpJCr36xGOFhIDLjapHQ88d6ybjxposBwtw0x/6ZRk/qcCufD1pwhy04Xfc7MXh4Tqc1WpZd
                                        jz25sNS0h0e4gntWJ+Vxxz7EV13g/wAS3F5c/wBnajJ5rlSYZW+8cdVPrxzn2NM1rxfpOp6Pc2giuC8iHyyyDAYcg9fWuZ8PMU8SWBXg+eo/Pj+tdsk69F+1jZo86Mo4b
                                        ER9jO8Wd342/wCRXm/30/8AQhXH+Df+Rqtfo/8A6Aa7Dxt/yK83++n/AKEK4/wb/wAjVa/R/wD0A1hhv90n8/yOnF/79T+X5mrr3i7UrPVryxhS2MKHYC0bFsFR33e9ce
                                        jGORWXqpBGfavWr7SNOmjnnlsLZ5ihJkaFSxOOucV5PbgNcRBhkF1BB781vg5wlB8qta1/M5swp1YVE5yve9vI67SvGmqXur2ttMlqI5ZQjFY2BwT2+aq3xA/5D0P/AF7
                                        L/wChNXbxaNpkMqyQ6daxyKcqywqCD6g4riPiB/yH4f8Ar2X/ANCaubDzpzrpwjbQ68VTq08K1Vld3Q3QfEkWheH5kWPzrmS4YomcADaoyf8APOKhbxxrTSbhLCo/urEM
                                        frz+tT+C9Dg1O4mur2MSQw4VUb7rMfUd8Dt7103iTQ7GbQbmSK1ijlgjMkbxoFI2jOOO1aVJ4eFbllG7e7MqVPFTw6nGVkloiDwz4s/tiX7JeokV1jKlPuyeuAeh9q6av
                                        INFmaDXbGRPvC4QfgSAf0Nev1yY2jGlNcuzO/LsROtTfPugooorhPSCuI8daIxYarbJkYC3AA6ejf0P4V29IyhlKsAQRggjrW1Gq6U1JHPiKEa9NwZ4zDd3NsCLa5mhB6
                                        iKQrn8jS21tcahepBArSzzNgZPU+pP9a9Au/Aml3E5khea2DdUjI2/hkHFaekaBY6Kh+yRkyMMNK5yzf4fhXqyx9JRvFaniQyys5cs37pPpWnx6XpkNnFyI1wWx949Sfx
                                        NXKKRzhCR2FeK25O7PoYxUUorZHm/xa+JyeDNO/s7SZFbW7pMpwGFsn/PQg8Z9AfqeBg/OGh6LqfizxDDp2nK1ze3bks7sTjnLO7eg6k/zJqrqWpXesancahqU7XF1cOX
                                        llfqx/w7AdgMV0vgr4i3/gSO4/sfTNNlnuCPMubmORpCo6KCHAA78DnvnAx9BTouhTtBXkeROqq1T33ZH054K8Haf4I8OxaZp43v9+4uCuGnk7sfQdgOwroa+bP+GivFn
                                        /QP0f8A78y//HK9U+EvjvU/Hmjahd6vBawyW1wIkFsjKCNoPO5jzzXk1sPWinUmejTrUpNQgcR+0Z4d50vxHAhPWzuD6dWjP/oYz9K5r4FeK4fD3ibUbW+kWOzu7N5mZu
                                        zwguP/ABzzPyFe9ePPDv8AwlXgfU9JRQ080Ja33HGJV+ZOe3zAD6E18agshOMqeQe3sRXdhbVqDpy6HHiL0qyqI05HvvF3ixnC5vtWvchRyA8j9PoCfyFfZej6ZBoui2e
                                        mWgxBZwJCnGMhRjJ9zjNfOvwA8N/2r42l1idCYNJi3Ic/8tXBVfr8u8/XFfS9YY+peSprobYOHuub6nzZ+0V/yUCw/wCwYn/o2Sug/Zq/1PiP/etv5SVz/wC0V/yUCw/7
                                        Bif+jZK6D9mr/U+I/wDetv5SVvP/AHL7vzMY/wC9/wBdj3OvinxX/wAjprn/AGErn/0a1fa1fFPir/kdNc/7CVz/AOjWrLLvika434UfU/wo/wCSU6B/17f+zGq3xV8dr
                                        4I8KM1s6/2pe5is1PO04+aTHooI/EgUvw3vrbS/gzpF9fzLDbW1k0ssjdFUFiTXzb478X3PjXxXc6rPuSH/AFdtCT/qoh0H1PJPuT2xUUaHta8m9kyqtb2dJJbtGTp+la
                                        jrUlz/AGfby3b28D3M5XkrGvLOfXr9TmtfwF4wuPBPiy31WEGSA/urqEf8tYj1H1GAR7gds19C/B7wJ/wiXhHz9Qh26pqYEtyrjmNP4YyD0wDkj1JHYV4f8WPBB8F+MJB
                                        axkaXfZntD2Tn5o/+Ak8f7JWu6OIhWnKk9vzOSVGdKCqLc+rLK9t9RsYLyylWa3uIxJFIp4ZSMg1wvxB/5DVt/wBe/wD7Ma4b4B+PPLkPhHVJfkctJp7seh6vF/Nh/wAC
                                        9q7j4g/8hq2/69//AGY1x4ek6WK5WVjqiqYTmXkXfh193UfrH/7NXa1xXw6+7qP1j/8AZq7WufGfx5fL8joy/wD3WPz/ADZ5BrX/ACHr/wD6+ZP/AEI132kRNP4AWJOWk
                                        tpFH1O6uB1r/kPX/wD18yf+hGvSPCv/ACK9l/uH/wBCNd2MdqMH5r8jy8vXNiKi8n+Z5XGFaRA7bUJGWxnA9a7UfDxSARqmQeh8j/7KsXxRoMmkag8sSH7HMxMbAcIT/C
                                        fT29qsaP40u9MtltriJbqJBhMttZR6Z5yK3qyq1IKdBnPRjRo1JU8VH8/0NP8A4V2P+gmf+/H/ANlVzSvBQ0vVIL0X5k8ok7PJxnII6596zbj4hzNHi0sERv70khYfkAP
                                        51o+C9UvNVe/lvp2lYFNo6BR83QCuOp9bjTcpvT5HoUvqMq0Y0o3fz6a9TA8aarJea09oHIt7UhQoPBbHJPv2/D3qbw54PTVbFb29neOJydiR4ywBxkk+4qp4x02Wy16W
                                        cqfJuTvR+2ccj65qfQ/GMukWC2ctqLiNCdhD7SMnOOhz1rqtP6vH2H9dzivT+tyeJ21/4H4GvrHhLSNO0W6uU80SRxEoWk/i7friuS0I48Q6f/18J/6EK0tU17UPFDi1t
                                        4BFAgMrRqc8AZLMfQf5ycVl6I23XrA9vtMf/oQqqUakaUlUd2RXnSlXi6KtH8zv/G3/ACK83++n/oQrj/Bv/I12v0f/ANANdh42/wCRXm/30/8AQhXH+Df+Rqtfo/8A6A
                                        a5sN/uk/n+R2Yv/fqfy/M9Luv+POb/AK5t/KvG7b/j6h/31/nXs7oJI2RujAg141c28tjeSW8wKSwvtb6jv/WllzVpIebJpwl6/oez1538QP8AkPQ/9ey/+hNWjY+PXuJ
                                        ra2ksVEssiRtIJPlGSASBj9M1nfED/kPQ/wDXsv8A6E1RhaM6VdKa7mmNxFOvhm6bvqja+H3/ACA7j/r6P/oC1u6z/wAgK/8A+vaT/wBBNYXw+/5Adz/19H/0Ba3dZ/5A
                                        V/8A9e0n/oJrnr/7y/U6sN/ua9DynTP+QxZf9fMf/oYr2OvHNM/5DFl/18x/+hivY66cx+KJx5R8M/kFFFFeWe2FFFFABRRRQAUEZBB6GiigDif+FPeA/wDoXov+/wDL/
                                        wDF0v8Awp7wH/0L0X/f+X/4uu1orX21X+Z/eZ+zh2RxX/CnvAf/AEL0X/f+X/4ut7w94V0XwrbTW/h+xWzimfzJFV2bc2MZ+YntWvWd4hnmtvDOqT2oczRWcrxiMEsWCE
                                        jGOc5pOpOfuuTHyRjqkaNfGXjprBvH+uNpDK1mb2QxlCCp5+bGOMbs49sUt34x8XzWr2F9r2rvE6lJIZbmT5geCDk5I9jXTfDT4Val4q1iC81ezltdEhYPK8ylDcY/gQH
                                        kg926AZ5zXr0aKwqc5yPNq1HiGoRR7R8GPDf/AAj3w3s3lQLc6iftkvHOGHyD/vgLx6k131AGBgUV485ucnJ9T04RUYqKOe1/wH4a8UXyXmvaWl5cRxiJXaV1woJOPlYD
                                        qTU/h3wfoXhMXA8P6etkLkqZdsjtu25x94n1P51tUUc8+XlvoHLG97ahXHXXwn8EXl5NdXOgxyTTyNLI5nlG5mOSeG9TXY0UozlH4XYHFS3Riz+D9CuPDEfh2axB0mMAL
                                        aiVwMA5AJByeeeTWRbfCbwPaXUVxB4fhEsLiRC0sjAMDkcFsH8a7GiqVSa2bE4Re6CsrxB4Y0bxTZx2uv2KXkMUnmIrMy7WwRkFSD0JrVoqE2ndFNJqzOOtvhP4JsruG6
                                        tNDWGeB1kikS4lDIwOQQd/UGuiv9D07U5llvrYSuq7QSzDA/A1foq/a1L35mQ6cGrNKxT0/SbHS/M+wQCHzMb8MTnHTqfc1cooqHJyd2VGMYq0VZGTN4X0a4neaayVpJG
                                        LM29uSeT3rRtbWGytkt7ZPLijGFXJOPzqWiqlUnJWbJjThF3jFJjZI0ljZJUV0YYZWGQRWHceDNFuG3C2aE/9MnIH5dK3qKIVJw+F2CdKnU+NJnPw+CdFibLQyS+zynH6
                                        YratrS3soRFaQpDGP4UXAqainOrOfxO4oUadP4IpEVzawXkDQ3USSxt1VxkVhv4H0V5NwilQf3VlOP15roaKIVZw+F2CpRp1NZxTKdnpNjYW7wWlskcbjD46t9T1NVIvC
                                        2jQypJFZKrowZTvbgjkd616KPaTV9XqDo02knFaeRBeWVvqFsbe8j82JiCVJIzj6VUtPD2l2F0txaWgjlTO1g7HGRjua0qKSnJLlT0KdOEpczSuFZ2paDp2rENe24aQDA
                                        kUlWA+orRopRlKLvF2HKEZq0ldGDbeDdHtbhJkikZ42DLvlPBHINX7/Q9O1OcTX1sJZFXaGLMOM5xwfc1foq3WqN3cnczVClGPKoq3oVbDTbTTIWisYRFGzbyoJOTgDPP
                                        0FTzRJPA8Mq7o5FKsvqDwRT6Kzcm3dvU0UYpcqWhkR+FtGhlSWOxVXRgyne3BByD1rXoopynKXxO4oU4Q+FWCiiipLCiiigAooooAKKKKACiiigAooooAKKKKACiiigAo
                                        oooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Z" alt="zynx_health"  class="logo"></img>
                         </td>
                      </tr>
                      <tr>
                          <td>
                              <h1><xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"/></h1>
                              <h2> Version : <xsl:value-of select="version/@value"/></h2>
                              <h2> <xsl:value-of select="date/@value"/></h2>
                          </td>
                      </tr>
                      <tr>
                          <td>
                              <table width="100%" border="0" cellpadding="0" cellspacing="10">
                              <xsl:for-each select="action">
                              <tr>
                                  <td id="activity" class="panel">
                                      <table>
                                          <tr>
                                              <td>
                                                  <input type="checkbox" class="checkbox"></input>
                                              </td>
                                              <td>
                                                  <img border="0" alt="P" src="data:image/png;base64,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
  " width="18" height="20" class="url-icon"></img>
                                              </td>
                                              <td>
                                                  <xsl:value-of select="title/@value"/>
                                              </td>
                                          </tr>
                                      </table>                                         
                                  </td>
                              </tr>
                              <xsl:for-each select="action">
                                  <xsl:variable name="selection" select="selectionBehavior/@value"/>
                                  <xsl:variable name="ADtitle" select="title/@value"/>
                                  <xsl:variable name="textEquivalent" select="textEquivalent/@value"/>
                                  <xsl:variable name="displayValue" select="documentation/display/@value"/>
                                  <xsl:variable name="urlValue" select="documentation/url/@value"/>
                                  <tr>
                                      <td id="goals">
                                          <xsl:choose>
                                              <xsl:when test="$selection !=''">
                                                  <span class="checkbox">
                                                      <input type="checkbox"></input>
                                                      <xsl:if test="$ADtitle !=''">
                                                          <xsl:value-of select="$ADtitle"/>
                                                      </xsl:if>
                                                  </span>
                                              </xsl:when>
                                              <xsl:otherwise>
                                                      <xsl:if test="$ADtitle !=''">
                                                          <span class="no-checkbox">
                                                              <xsl:value-of select="$ADtitle"/>
                                                          </span>
                                                      </xsl:if>
                                                      <xsl:if test="$textEquivalent !=''">                   
                                                              <input type="checkbox" class="checkbox"></input>
                                                              <xsl:value-of select="$textEquivalent"/>
                                                      </xsl:if>
                                              </xsl:otherwise>
                                          </xsl:choose>
                                          <xsl:if test="$urlValue !=''">
                                              <span class="spacing">
                                                  <a href="{$urlValue}" class="url-icon" target="_blank" title="{$displayValue}">
                                                      <img border="0" alt="Z" src="data:image/png;base64,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
  " width="18" height="20" class="url-icon"></img>
                                                  </a>
                                              </span>
                                          </xsl:if>
                                      </td>
                                  </tr>
                                  <xsl:for-each select="action">
                                      <xsl:variable name="selection1" select="selectionBehavior/@value"/>
                                      <xsl:variable name="ADtitle1" select="title/@value"/>
                                      <xsl:variable name="goals" select="textEquivalent/@value"/>
                                      <xsl:variable name="displayValue1" select="documentation/display/@value"/>
                                      <xsl:variable name="urlValue1" select="documentation/url/@value"/>
                                      <tr>
                                          <td id="actions-norma">
                                              <table cellspacing="5" cellpadding="0" width="100%" border="0">
                                                  <tr>
                                                      <td width="1%">
                                                          <xsl:if test="$selection1 !=''">
                                                          <input type="checkbox" class="checkbox"></input>
                                                          </xsl:if>
                                                      </td>
                                                      <td width="1.5%">
                                                          <xsl:if test="$selection1 !=''">
                                                          <img border="0" alt="O" src="data:image/png;base64,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
  " width="20" height="22" class="url-icon"></img>
                                                          </xsl:if>
                                                      </td>
                                                      <td>
                                                          <xsl:if test="$ADtitle1 !=''">
                                                          <xsl:value-of select="$ADtitle1"/>
                                                          </xsl:if>
                                                          <xsl:if test="$goals !=''">
                                                          <xsl:value-of select="$goals"/>
                                                          </xsl:if>
                                                      </td>
                                                      <td>
                                                          <xsl:if test="$urlValue1 !=''">
                                                          <span class="spacing">
                                                          <a href="{$urlValue1}" class="url-icon" target="_blank" title="{$displayValue1}">
                                                          <img border="0" alt="Z" src="data:image/png;base64,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
  " width="20" height="20" class="url-icon"></img>
                                                          </a>
                                                          </span>
                                                          </xsl:if>
                                                      </td>
                                                  </tr>
                                              </table>
                                           </td>
                                      </tr>
                                      <xsl:for-each select="action">
                                          <xsl:variable name="section" select="title/@value"/>
                                          <xsl:variable name="actionDetail" select="textEquivalent/@value"/>
                                          <xsl:variable name="displayValue2" select="documentation/display/@value"/>
                                          <xsl:variable name="urlValue2" select="documentation/url/@value"/>
                                          <tr>
                                              <td id="actions-detail">												
                                                  <table cellspacing="8" cellpadding="0" width="100%" border="0">											
                                                  <tr>
                                                      <td width="2%">
                                                          <xsl:if test="$actionDetail !=''">
                                                          <input type="checkbox" class="checkbox"></input>
                                                          </xsl:if>
                                                      </td>
                                                      <td width="12%" nowrap="1">
                                                          <xsl:if test="$actionDetail !=''">
                                                          <xsl:value-of select="$actionDetail"/>
                                                          </xsl:if>
                                                      </td>
                                                      <td nowrap="1">
                                                          <xsl:if test="$section !=''">
                                                          <xsl:value-of select="$section"/>
                                                          </xsl:if>												
                                                          <xsl:if test="$urlValue2 !=''">
                                                          <span>
                                                          <a href="{$urlValue2}" target="_blank" title="{$displayValue2}">
                                                              <img border="0" alt="Z" src="data:image/png;base64,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" width="18" height="20" class="url-icon"></img>
                                                          </a>
                                                          </span>
                                                          </xsl:if>
                                                      </td>													
                                                  </tr>	
                                                  </table>
                                              </td>
                                          </tr>
                                          <xsl:for-each select="action">
                                              <xsl:variable name="selection2" select="selectionBehavior/@value"/>
                                              <xsl:variable name="detail" select="textEquivalent/@value"/>
                                              <tr>
                                                  <td id="detail">
                                                      <table cellspacing="4" cellpadding="0" width="100%" border="0">
                                                          <tr>
                                                              <td width="1%">
                                                                  <xsl:if test="$detail !=''">
                                                                  <img border="0" alt="D" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAmCAYAAAClI5npAAAAAXNSR0IArs4c6QAAAARnQU1BAACxj
                                                                                               wv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAiqSURBVFhH7Vb7U9TXFe/fkh/6a/pD27SddlIzyWTa1DZpMnYyNkmnibYmGuNb
                                                                                               MahRFBGDLwQUVIKIPATkuSwLCwvIgvLeXdhlX+wu+2Jh3292+fSci7uEaONPnf7imbnDlz333vM5r8+5P8H/WV4CeAngJYCXAH4
                                                                                               UwBqt+GoarmAaA/Nh3B5awqkWG3Z+Z8K713TYUqChpcZfruqwo9KEkw9tqBh0o08Xgj2QRozOvkieC4ANJ1bX4AmuQrUYgWwujF
                                                                                               tDHpzvtCOn0YY99xbw6R0Ttpfrsf2mHv+k793027FGK/JpT8XgEjpn/JiyhODyJxBProk7nyfPAMgYt60koJgPoaTPjePNNuFdU
                                                                                               bcDd4c96JjxYVAfxLglgglrRHx3qHyoVnpwSebEiWYrDt03orDDgm6VF+alGGLJNNaeg+IZADEybl1JQkIeXOtbRl6nEwUSh7i8
                                                                                               Zy6AaVsENm8CwXgKKbowTStE34u+BGZsUchpT7VyCfltFnzduEBRW0TDqBPzjhAitO+HGDYB4Aud/lX068L4VubGgQYbrspdUOi
                                                                                               CWGSjsRSiibSIEBvOCH8n6DDreA+DGaKoXOm2Y1flPHIb9Gh+bIfRFaSzqaen1mUTgDBdMLYQxg2Fhzx3oUjmEh65A6tIvbiess
                                                                                               J7l8Mp9M35UdhpxZFaPfKatOgat8HjDWE1tQEiC4AdsvnTaJ32I5fyfanbiT5tUESEi5n1cfLcF0nB4U9iYTkulpmWhRaDDMbSt
                                                                                               He94DgqbipihS6AgnYzdt9R4abMiGmDC8FIjE0K2QBAB3op9OWDyzhBAOoeL1Mok8I4S4putHmT6KWIcJXndzqQ176IM22LIs/V
                                                                                               I8siesvhjWjxX2cgiYYnHhyqncfphlk0DOhgdfmxll6PQhYAI75CFVxAbXSZ/j7SU9FQSjKSpByPW8IopILk9vvDZS3eL9FjW5k
                                                                                               efyZO+OSWEfkdDuKLIPzRFDInY9SCoyaqqS4b9lVOIr9+AlMGJ5LJuNBnAbCHe2sWcLp1EffJmzlHTBRbRpiQemf92HXXjC2FGr
                                                                                               z17Sy+qF7A0QdWfFRhwO8vzOLNi7O4KHXS2SiiZJiFgetccVQPu/Fl5Qx23xiBdFQHj9sl9FkAnLv3iudxvMmGbk0ADg4/t8VTi
                                                                                               VIfP5z04v3rOvz2vBoflRtQPuCGVO2nv0uCkF49NYN/EUt2qfxYovyzsGMuqo9utRd7q2bx4aVh1EjHYdTPC30WACP91Vk1DjdY
                                                                                               8MQcoT5Pb2q1MP3PXPAmec7rBJHTYwptgMJt8sQFS/4yT01pmReUvbCcEOf4Cj77xBzCvhoD3ikYxY2mR5iZnhT6TQB+mjOJfXU
                                                                                               LmHPGBCdkhD+XQ6vEii7h/dZrWlyXu2Fwx4WOe7+s341fn1OLeiilbyOBygjfpXXFsL+O0nd2FBfvyTE6Mix0mwC8cmQCX9UuYN
                                                                                               4dExdnJE4649K6lxylDync97lLqCu4ezjcXLivke4DKszbNDcyEWDhuwx0/kC9Bb87rUTebQkUfb1CtwnAqydncJA2TROlMiVnQ
                                                                                               ASjaYwaQjhcbxVG/n3XhF6qk5VQSvT+MOkOUOR+fkZFg8mI1kmfyDsL38H8wTS9v9aEN84M4fSNFsikEqHfKEIC8HbRnJhoTL0e
                                                                                               Cnmmnz3BFNqnfNhZZcIv8lQUygUMUbtZyEulMYTzEjv+dFWL3+Sr8U2rDVM0oMIEjIXraIVYUaHzY1+1DlvPKZBf3oKebqnQbwC
                                                                                               gnZ/RWD1J875p3Eshpzbk5JFwqO9QYW0r1eNnp6ap/cxonvCiY9qHwi4HtpLx186q8NcSHWpGl4XBzORL0r1mAto45sHe71T4+0
                                                                                               U5rlZ1QNEvF/osAG6XPGK1/I5F3KAiYlZjEmHRU7Ex63Gvv3J0kv5q6FFixKeVRrxbTA8T4gWuCx7Fk+Q9c0ZGOPxT1iiu99qxp
                                                                                               2IMe4p7UPlARkWoFPosAEZcP+bF1V4nAbGhc9pLvL8qfmcA+R12YYwrndfrBOJ1ehH98YpW1ARzAodesOBT7/ks/9+t8eFrmohf
                                                                                               lA3hVIUUzRIFteGU2LMBgJbakcA9YsHDtUaUyu1Q02soHOcBlIaSCq1pYoU434PKRx5KyfrimcHzQUutG6BifZo1IZHEGjTEimX
                                                                                               yRewoG8OX16QovteJ/qERGPR6sScLgGWFBomMXjAnG0345qGFwCxBY4+Ki5iW+VXDM59nRGYxQ3KYxRT8nnH+bc4ZxT2lC4eq1f
                                                                                               ikqA/HS9pQ39IFlUoDz9KS2LcJAF+id0XF9MpttmB31TwqFE4CEUOE6oFDy+v7hjLCv2X0DIz5//agCzvKVdhepMCh650or5Vgc
                                                                                               EgJp5OG0WpSnNsEgC9hVpuxhlDaY6W20SKHcnezz45+rV8wJI9kL70J2EPGwYu/fRR+O+mY8Xgi3hqwY3/VDP5W2I9dlztQUiNB
                                                                                               r0KJOa0WgYCfin69UDcBYOEc+qOrGDP6UDVoxbH7s/j8thonm80o63PiIdWB0rCeczs9TPhxoiOjI8YgEdAKdRA9ShuN+KxsHP8
                                                                                               okgvPOe+dMgVm5+bgdrsRTySyJPcMABZuSW84gSnzCmoGTLjQosOxGg0O3lXhCAHKfaDH6RYLztFDhJ/hZ1otZNSAo6T76s4kPi
                                                                                               8bxq4rUuSUtKO8rgsyxTDUag0cdjsikUjWe5bnAmBJE4hwLAGL04ch1SLKJWrk3h3DzpIRbLs0gncuPMEb58ew5dwTvJ2vxHsFQ/
                                                                                               iYcr2nuBcnyqW4UtWOuhYpFIPDIuxul+sZ4yz/FQBLmooinkjC7QtBZXRDPmlBTY8KxU2Pca76EXIq5DhYKsWh4nbklrah4I4EZ
                                                                                               XUy1LX3Q9ZPI3dGDZvNBq93BbEYTdgfGGf5UQAsnCsGkkgmEAgGYTKZMTExhYGBQUi6pGhsakZtbR3qGx6gta0NPb09UCpHoKGQ
                                                                                               s9fxeFy8gtee1zokLwTwvxXgP9nXVFIjqIdLAAAAAElFTkSuQmCC" width="20" height="22" class="url-icon"></img>										
                                                                  </xsl:if>
                                                              </td>	
                                                              <td>
                                                                  <xsl:if test="$detail !=''">
                                                                  <xsl:value-of select="$detail"/>
                                                                  </xsl:if>
                                                              </td>														
                                                          </tr>	
                                                      </table>	
                                                  </td>
                                              </tr>
                                          </xsl:for-each>
                                      </xsl:for-each>
                                  </xsl:for-each>
                              </xsl:for-each>
                              </xsl:for-each>
                          </table>						
                          </td>
                      </tr>					
                  </table>                               
               </body>
          </html>
      </xsl:template>
  </xsl:stylesheet>
  `;

  getXSL(typeContent:string){
    if(typeContent==='os'){
      return this.myOrdersetXSLFile;
    } 
    if(typeContent==='poc'){
      return this.myOrdersetXSLFile;
    } 
  }
}

export class XSLFileRemoveNamespace {

  xslFileRemoveNamespace=`<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes"/>
 
    <xsl:template match="*">
        <xsl:element name="{local-name(.)}">
            <xsl:apply-templates select="@* | node()"/>
        </xsl:element>
    </xsl:template>
    <xsl:template match="@*">
        <xsl:attribute name="{local-name(.)}">
            <xsl:value-of select="."/>
        </xsl:attribute>
    </xsl:template>
 
    <xsl:template match="@*[local-name(.)='noNamespaceSchemaLocation']"/>
</xsl:stylesheet>
`;

  getXSLFileRemoveNamespace(){
    return this.xslFileRemoveNamespace;
  }
}
