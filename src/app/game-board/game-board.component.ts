import { Component, Input } from '@angular/core';
import { STATE, VgModelService } from '../services/vg-model.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {

  range = (n:number) => [...Array(n).keys()]
  state: STATE;

  constructor(private vg: VgModelService){
    this.state = vg.state
  }

  onClick = (c:number) => {
    this.vg.move(c)
    // console.log( this.vg.state )
    // console.log( "DUMP")
    // console.log(c);
    // console.log( this.vg.state )
    // this.range(6).forEach( r => {
    //   const s = this.range(7).reduce((acc,c)=> {
    //     const x = c + 7 * (5-r);
    //     if( this.vg.state.board[x] === this.vg.STYP.player1 ) return acc + " R "
    //     if( this.vg.state.board[x] === this.vg.STYP.player2 ) return acc + " B "
    //     return acc + " _ "
    //   },"")
    //   console.log("row", r , s+ "\n")
    // })

  }
  getClass = (row:number,col:number):string =>  {
    const x = col + 7 *  (5-row);
    // console.log( row, col, x, this.vg.state.grstate[x].occupiedBy)
    if( this.vg.state.board[x]=== this.vg.STYP.player1 ) return "player1"
    if( this.vg.state.board[x] === this.vg.STYP.player2 ) return "player2"
    return ""
  }
}
