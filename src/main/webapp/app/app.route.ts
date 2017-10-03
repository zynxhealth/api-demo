import { Route } from '@angular/router';

import { NavbarComponent } from './layouts';
import { smartFhir } from "./smart-fhir"

export const navbarRoute: Route = {
    path: '',
    component: NavbarComponent,
    outlet: 'navbar'
};

export const smartFhirRoute: Route = {
  path: 'smart_fhir',
  component: smartFhir
}
