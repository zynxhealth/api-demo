import {Component} from '@angular/core';
import {DataService} from './data-service';
import {Renderer} from '@angular/core';

@Component({
  selector: 'input-form-example',
  templateUrl: 'input-form-example.html',
  styleUrls: ['input-form-example.css'],
})
export class InputFormExample {
  constructor(private dataService : DataService,private renderer: Renderer){}

  searchOnKeyUp(event: any) {
    if (event.key === "Enter") {
      this.dataService.searchByName(event.target.value);
      this.renderer.invokeElementMethod(event.target,'blur');
      this.renderer.invokeElementMethod(event.target,'focus');
    }
  }
}


