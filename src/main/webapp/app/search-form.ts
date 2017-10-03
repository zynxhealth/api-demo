import {Component} from '@angular/core';
import {DataService} from './data-service';
import {Renderer} from '@angular/core';

@Component({
  selector: 'search-form',
  templateUrl: 'search-form.html',
  styleUrls: ['search-form.css'],
})
export class SearchForm {
  constructor(private dataService : DataService,private renderer: Renderer){}

  searchOnKeyUp(event: any) {
    if (event.key === "Enter") {
      this.dataService.searchByName(event.target.value);
      this.renderer.invokeElementMethod(event.target,'blur');
      this.renderer.invokeElementMethod(event.target,'focus');
    }
  }
}
