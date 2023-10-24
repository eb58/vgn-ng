import { Component } from '@angular/core';
import { VgModelService } from './services/vg-model.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Vier gewinnt';
  state;

  constructor(private vg: VgModelService){
    this.state= vg.state
  }
  
}
