import { Component } from '@angular/core';
import { ConnectFourModelService } from './services/model.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Vier gewinnt';
  state;

  constructor(private vg: ConnectFourModelService){
    this.state= vg.state
  }
  
}
