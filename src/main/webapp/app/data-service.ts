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
<PlanDefinition xmlns="http://hl7.org/fhir">
    <id value="ZynxOS-795"/>
    <meta>
        <versionId value="1"/>
        <lastUpdated value="2017-07-31T23:23:50.516+00:00"/>
    </meta>
    <identifier id="ZynxOS-795"/>
    <!-- Final format TBD -->
    <version value="29"/>
    <name value="AsthmaAdmissiontoICU"/>
    <title value="Asthma - Admission to ICU"/>
    <type id="order-set"/>
    <status value="draft"/>
    <date value="2017-07-17"/>
    <publisher value="Zynx Health"/>
    <action>
        <title value="General"/>
        <code id="2"/>
        <groupingBehavior value="logical-group"/>
        <definition>
            <reference value="ActivityDefinition/ZR63243"/>
        </definition>
        <action>
            <title value="Classify the severity of the exacerbation to determine level of care"/>
            <code id="2"/>
            <documentation>
                <type value="justification"/>
                <display value="Asthma>General Information>Classification"/>
                <url value="https://www.zynx.com/Reference/Content.aspx?ItemID=10709"/>
            </documentation>
        </action>
    </action>
    <action>
        <title value="Activity"/>
        <definition>
            <reference value="ActivityDefinition/ZR1671"/>
        </definition>
        <action>
            <title value="Bed rest"/>
            <selectionBehavior value="any"/>
            <definition>
                <reference value="ActivityDefinition/ZR3180"/>
            </definition>
        </action>
        <action>
            <title value="Bed rest with bathroom privileges"/>
            <selectionBehavior value="any"/>
            <definition>
                <reference value="ActivityDefinition/ZR71774"/>
            </definition>
        </action>
        <action>
            <title value="Bed rest with bedside commode"/>
            <selectionBehavior value="any"/>
            <definition>
                <reference value="ActivityDefinition/ZR71775"/>
            </definition>
        </action>
    </action>
    <action>
        <title value="Nursing Orders"/>
        <definition>
            <reference value="ActivityDefinition/ZR1959"/>
        </definition>
        <action>
            <title value="Assessments"/>
            <definition>
                <reference value="ActivityDefinition/ZR1697"/>
            </definition>
            <action>
                <title value="Assess respiratory status"/>
                <selectionBehavior value="any"/>
                <definition>
                    <reference value="ActivityDefinition/ZR77646"/>
                </definition>
            </action>
            <action>
                <title value="Cardiac monitor"/>
                <selectionBehavior value="any"/>
                <definition>
                    <reference value="ActivityDefinition/ZR1160"/>
                </definition>
            </action>
            <action>
                <title value="Measure intake and output"/>
                <selectionBehavior value="any"/>
                <definition>
                    <reference value="ActivityDefinition/ZR2237"/>
                </definition>
            </action>
        </action>
        <action>
            <title value="Interventions"/>
            <definition>
                <reference value="ActivityDefinition/ZR1966"/>
            </definition>
            <action>
                <title value="Elevate head of bed"/>
                <selectionBehavior value="any"/>
                <definition>
                    <reference value="ActivityDefinition/ZR3232"/>
                </definition>
            </action>
            <action>
                <title value="Peripheral venous cannula insertion/management"/>
                <selectionBehavior value="any"/>
                <definition>
                    <reference value="ActivityDefinition/ZR3063"/>
                </definition>
            </action>
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
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="PlanDefinition">
         <div>
                <h1 style='color: #43609c;font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;font-size: 26px;'><xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"
                    /></h1>
                <h2 style='color: #43609c;font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;font-size: 18px;'> Version : <xsl:value-of select="version/@value"/>
                </h2>
                <h2 style='color: #43609c;font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;font-size: 14px;' >
                    <xsl:value-of select="date/@value"/>
                </h2>
                <style>table td {font-size: 18px!important; padding:5px 0!important;} input {margin-right:5px!important;}</style>
                <table style="border-collapse: separate;">
                    <xsl:for-each select="action">
                            <tr>
                                <td id="section" style="vertical-align: text-top;font-size: 16px; color: #43609c; font-weight: bold; border-bottom:1px solid #e6e6e6; padding-top:15px!important;"><xsl:value-of select="title/@value"/></td>
                            </tr>
                            <xsl:for-each select="action">
                                <xsl:variable name="selection" select="selectionBehavior/@value"/>
                                <xsl:variable name="ADDtitle" select="title/@value"/>
                                <xsl:variable name="textEquivalent" select="textEquivalent/@value"/>
                                <!--<xsl:variable name="textEquivalent" select="documentation/display/@value"/>-->
                                <xsl:variable name="urlValue" select="documentation/url/@value"/>
                                <tr>
                                    <td id="sub-section" style="vertical-align: text-top;color: #000000;left: 85px;top: 458px;word-spacing: -0.3px;font-size: 14px;">
                                        <xsl:choose>
                                            <xsl:when test="$selection !=''">
                                                <span style="left: 61px; letter-spacing: 0.2px; top: 460px;">
                                                    <input type="checkbox"></input>
                                                    <xsl:if test="$ADDtitle !=''">
                                                        <xsl:value-of select="$ADDtitle"/>
                                                    </xsl:if>
                                                    <!--<xsl:if test="$textEquivalent !=''">-->
                                                        <!--<xsl:value-of select="$textEquivalent"/>-->
                                                    <!--</xsl:if>-->
                                                </span>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                    <xsl:if test="$ADDtitle !=''">
                                                        <span style="font-weight: bold; font-style: italic;">
                                                            <xsl:value-of select="$ADDtitle"/>
                                                        </span>
                                                    </xsl:if>
                                                    <xsl:if test="$textEquivalent !=''">
                                                        <span style="left: 61px; letter-spacing: 0.2px; top: 460px;">
                                                            <input type="checkbox"></input>
                                                            <xsl:value-of select="$textEquivalent"/>
                                                        </span>
                                                    </xsl:if>
                                            </xsl:otherwise>
                                        </xsl:choose>

                                        <xsl:if test="$urlValue !=''">
                                            <span style="padding-left: 20px;">
                                                <!--<xsl:value-of select="documentation/display/@value"/>-->
                                                <a href="{$urlValue}" style="text-decoration: none;" target="_blank">
                                                    Evidence
                                                </a>
                                            </span>
                                        </xsl:if>

                                    </td>
                                </tr>
                                <xsl:for-each select="action">
                                    <xsl:variable name="selection1" select="selectionBehavior/@value"/>
                                    <xsl:variable name="ADDtitle1" select="title/@value"/>
                                    <xsl:variable name="medication" select="textEquivalent/@value"/>
                                    <xsl:variable name="urlValue1" select="documentation/url/@value"/>

                                    <tr>
                                        <td id="medication" style="vertical-align:text-top;color:#000000;left:85px;top:458px;word-spacing:-0.3px;font-size:14px;">

                                            <xsl:if test="$selection1 !=''">
                                                <input type="checkbox" style="left: 61px; letter-spacing: 0.2px; top: 460px;"></input>
                                            </xsl:if>
                                            <xsl:if test="$ADDtitle1 !=''">
                                                <xsl:value-of select="$ADDtitle1"/>
                                            </xsl:if>
                                            <xsl:if test="$medication !=''">
                                                <xsl:value-of select="$medication"/>
                                            </xsl:if>
                                           <xsl:if test="$urlValue1 !=''">
                                                <span style="padding-left: 20px;">
                                                   <!--<xsl:value-of select="documentation/display/@value"/>-->
                                                    <a href="{$urlValue1}" style="text-decoration: none;" target="_blank">
                                                        Evidence
                                                    </a>
                                                </span>
                                            </xsl:if>
                                         </td>
                                    </tr>
                                    <xsl:for-each select="action">
                                        <xsl:variable name="dosage" select="textEquivalent/@value"/>
                                        <tr>
                                            <td id="med-detail" style="vertical-align:text-top;color:#000000;left:85px;top:458px;word-spacing:-0.3px;font-size:14px;">
                                                <xsl:if test="$dosage !=''">
                                                    <input type="checkbox" style="left: 61px; letter-spacing: 0.2px; top: 460px;"></input>
                                                    <xsl:value-of select="$dosage"/>
                                                </xsl:if>
                                            </td>
                                        </tr>
                                    </xsl:for-each>
                                </xsl:for-each>
                            </xsl:for-each>
                        </xsl:for-each>
                    </table>
         </div>
    </xsl:template>

</xsl:stylesheet>
  `;

  myPlanOfCareXSLFile=`<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="PlanDefinition">
         <div>
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
                    font-size: 14px;
                }
                td#actions{
                    color: #000000;
                    left: 85px;
                    top: 458px;
                    word-spacing: -0.3px;
                    font-size: 14px;
                    padding-left: 20px;
                }
                td#actions-detail{
                    color: #000000;
                    left: 85px;
                    top: 458px;
                    word-spacing: -0.3px;
                    font-size: 14px;
                    padding-left: 40px;
                }
                td#detail{
                    color: #000000;
                    left: 85px;
                    top: 458px;
                    word-spacing: -0.3px;
                    font-size: 14px;
                    padding-left: 80px;
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
                    left: 61px;
                    letter-spacing: 0.2px;
                    top: 460px;
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
                    padding-left: 20px;
                }
            </style>
                <h1><xsl:value-of select="publisher/@value"/> - <xsl:value-of select="title/@value"
                    /></h1>
                <h2> Version : <xsl:value-of select="version/@value"/>
                </h2>
                <h2>
                    <xsl:value-of select="date/@value"/>
                </h2>
                <table>
                    <xsl:for-each select="action">
                            <tr>
                                <td id="activity"><xsl:value-of select="title/@value"/></td>
                            </tr>
                            <xsl:for-each select="action">
                                <xsl:variable name="selection" select="selectionBehavior/@value"/>
                                <xsl:variable name="ADtitle" select="title/@value"/>
                                <xsl:variable name="textEquivalent" select="textEquivalent/@value"/>
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
                                                        <span class="checkbox">
                                                            <input type="checkbox"></input>
                                                            <xsl:value-of select="$textEquivalent"/>
                                                        </span>
                                                    </xsl:if>
                                            </xsl:otherwise>
                                        </xsl:choose>

                                        <xsl:if test="$urlValue !=''">
                                            <span class="spacing">
                                                <!--<xsl:value-of select="documentation/display/@value"/>-->
                                                <a href="{$urlValue}" class="url-icon" target="_blank">
                                                    Evidence
                                                </a>
                                            </span>
                                        </xsl:if>

                                    </td>
                                </tr>
                                <xsl:for-each select="action">
                                    <xsl:variable name="selection1" select="selectionBehavior/@value"/>
                                    <xsl:variable name="ADtitle1" select="title/@value"/>
                                    <xsl:variable name="goals" select="textEquivalent/@value"/>
                                    <xsl:variable name="urlValue1" select="documentation/url/@value"/>

                                    <tr>
                                        <td id="actions">

                                            <xsl:if test="$selection1 !='any'">
                                                <input type="checkbox" class="checkbox"></input>
                                            </xsl:if>
                                            <xsl:if test="$ADtitle1 !=''">
                                                <xsl:value-of select="$ADtitle1"/>
                                            </xsl:if>
                                            <xsl:if test="$goals !=''">
                                                <xsl:value-of select="$goals"/>
                                            </xsl:if>
                                           <xsl:if test="$urlValue1 !=''">
                                                <span class="spacing">
                                                   <!--<xsl:value-of select="documentation/display/@value"/>-->
                                                    <a href="{$urlValue1}" class="url-icon" target="_blank">
                                                        Evidence
                                                    </a>
                                                </span>
                                            </xsl:if>
                                         </td>
                                    </tr>
                                    <xsl:for-each select="action">
                                        <xsl:variable name="section" select="title/@value"/>
                                        <xsl:variable name="actionDetail" select="textEquivalent/@value"/>
                                        <tr>
                                            <td id="actions-detail">
                                                <xsl:if test="$actionDetail !=''">
                                                    <input type="checkbox" class="checkbox"></input>
                                                    <xsl:value-of select="$actionDetail"/>
                                                </xsl:if>
                                                <xsl:if test="$section !=''">
                                                    <xsl:value-of select="$section"/>
                                                </xsl:if>
                                            </td>
                                        </tr>

                                        <xsl:for-each select="action">
                                            <xsl:variable name="selection2" select="selectionBehavior/@value"/>
                                            <xsl:variable name="detail" select="textEquivalent/@value"/>
                                            <tr>
                                                <td id="detail">
                                                    <!--<xsl:if test="$selection2 !=''">-->
                                                        <!--<input type="checkbox" class="checkbox"></input>-->
                                                    <!--</xsl:if>-->
                                                    <xsl:if test="$detail !=''">
                                                        <xsl:value-of select="$detail"/>
                                                    </xsl:if>
                                                </td>
                                            </tr>
                                        </xsl:for-each>
                                    </xsl:for-each>
                                </xsl:for-each>
                            </xsl:for-each>
                        </xsl:for-each>
                    </table>
        </div>
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
