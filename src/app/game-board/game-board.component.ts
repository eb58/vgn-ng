import { Component, Input } from '@angular/core';
import { STATE, VgModelService } from '../services/vg-model.service';
import { DIM, FieldOccupiedType, range } from '../services/vg-model-static.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {

  state: STATE;
  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private vg: VgModelService) {
    this.state = vg.state
  }

  onClick = (c: number) => {

    if (this.state.whosTurn === "player1") {
      const res1 = this.vg.move(c)
      if (res1 === 'isMill') {
        alert("Gratuliere, du hast gewonnen!");
        return;
      }
      if (res1 === 'isDraw') {
        alert("Gratuliere, du hast ein Remis geschafft !");
        return;
      }

      const res2 = this.vg.move(this.vg.bestMove())
      if (res2 === 'isMill') {
        alert("Bedaure, du hast verloren!");
        return;
      }
      if (res2 === 'isDraw') {
        alert("Gratuliere, du hast ein Remis geschafft !");
        return;
      }
    }
  }

  getClass = (row: number, col: number): string => {
    const x = col + this.vg.NCOL * (this.vg.NROW - row - 1);
    // console.log( row, col, x, this.vg.state.grstate[x].occupiedBy)
    if (this.vg.state.board[x] === FieldOccupiedType.player1) return "player1"
    if (this.vg.state.board[x] === FieldOccupiedType.player2) return "player2"
    return ""
  }
}
