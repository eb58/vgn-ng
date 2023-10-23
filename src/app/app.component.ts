import { Component } from '@angular/core';
import { VgModelStaticService } from './services/vg-model-static.service';
import { VgModelService } from './services/vg-model.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng-four-wins';
  state;

  constructor(private vg: VgModelService){
    this.state= vg.state
  }
}
