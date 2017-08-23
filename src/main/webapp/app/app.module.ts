import './vendor.ts';

import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { Ng2Webstorage } from 'ng2-webstorage';

import { JpipeSharedModule, UserRouteAccessService } from './shared';
import { JpipeHomeModule } from './home/home.module';
import { JpipeAdminModule } from './admin/admin.module';
import { JpipeAccountModule } from './account/account.module';
import { JpipeEntityModule } from './entities/entity.module';

import { customHttpProvider } from './blocks/interceptor/http.provider';
import { PaginationConfig } from './blocks/config/uib-pagination.config';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  MdAutocompleteModule,
  MdButtonModule,
  MdButtonToggleModule,
  MdCardModule,
  MdCheckboxModule,
  MdChipsModule,
  MdCoreModule,
  MdDatepickerModule,
  MdDialogModule,
  MdExpansionModule,
  MdGridListModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdMenuModule,
  MdNativeDateModule,
  MdPaginatorModule,
  MdProgressBarModule,
  MdProgressSpinnerModule,
  MdRadioModule,
  MdRippleModule,
  MdSelectModule,
  MdSidenavModule,
  MdSliderModule,
  MdSlideToggleModule,
  MdSnackBarModule,
  MdSortModule,
  MdTableModule,
  MdTabsModule,
  MdToolbarModule,
  MdTooltipModule,
} from '@angular/material';
//import {TableSortingExample} from './table-sorting-example';
import {PatientNames} from './patient-names';
import {ProblemNames} from './problem-names';
import {DataSlider} from './data-slider';
import {ContentNames} from './content-names';
import {DataService} from './data-service';
import {ContentCard} from './content-card';

import {InputFormExample} from './input-form-example';
import {HttpModule} from '@angular/http';
import {CdkTableModule} from '@angular/cdk';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  exports: [
    CdkTableModule,
    MdAutocompleteModule,
    MdButtonModule,
    MdButtonToggleModule,
    MdCardModule,
    MdCheckboxModule,
    MdChipsModule,
    MdCoreModule,
    MdDatepickerModule,
    MdDialogModule,
    MdExpansionModule,
    MdGridListModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdMenuModule,
    MdNativeDateModule,
    MdPaginatorModule,
    MdProgressBarModule,
    MdProgressSpinnerModule,
    MdRadioModule,
    MdRippleModule,
    MdSelectModule,
    MdSidenavModule,
    MdSliderModule,
    MdSlideToggleModule,
    MdSnackBarModule,
    MdSortModule,
    MdTableModule,
    MdTabsModule,
    MdToolbarModule,
    MdTooltipModule,
  ]
})
export class PlunkerMaterialModule {}

// jhipster-needle-angular-add-module-import JHipster will add new module here

import {
    JhiMainComponent,
    LayoutRoutingModule,
    NavbarComponent,
    FooterComponent,
    ProfileService,
    PageRibbonComponent,
    ErrorComponent
} from './layouts';
import { OnlineDataDialogComponent } from './online-data-dialog/online-data-dialog.component';

@NgModule({
    imports: [
	BrowserAnimationsModule,
	FormsModule,
	HttpModule,
	PlunkerMaterialModule,
	MdNativeDateModule,
	ReactiveFormsModule,
        BrowserModule,
        LayoutRoutingModule,
        Ng2Webstorage.forRoot({ prefix: 'jhi', separator: '-'}),
        JpipeSharedModule,
        JpipeHomeModule,
        JpipeAdminModule,
        JpipeAccountModule,
        JpipeEntityModule,
        MdDialogModule,
        HttpClientModule  
        // jhipster-needle-angular-add-module JHipster will add new module here
    ],
    declarations: [
        InputFormExample,
        //TableSortingExample,
        PatientNames,
        ProblemNames,
        ContentNames,
        DataSlider,
        ContentCard,
        JhiMainComponent,
        NavbarComponent,
        ErrorComponent,
        PageRibbonComponent,
        FooterComponent,
        OnlineDataDialogComponent
    ],
    providers: [
        ProfileService,
        customHttpProvider(),
        PaginationConfig,
        UserRouteAccessService,
        DataService 
    ],
    bootstrap: [ JhiMainComponent ],
    entryComponents: [ OnlineDataDialogComponent ]
})
export class JpipeAppModule {}
