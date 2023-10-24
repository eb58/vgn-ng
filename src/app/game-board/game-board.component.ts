import { Component, Input } from '@angular/core';
import { STATE, VgModelService } from '../services/vg-model.service';
import { DIM, FieldOccupiedType, range } from '../services/vg-model-static.service';
import { DialogOverviewExampleDialog } from '../components/info-dialog/info-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  state: STATE;
  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private vg: VgModelService, public dialog: MatDialog) {
    this.state = vg.state
  }

  openDialog(info: string): void {
    const position = { top: '50%', left: '30%' }
    this.dialog.open(DialogOverviewExampleDialog, { position, data: { title: "Info", info } });
  }

  onClick = (c: number) => {
    this.info = ""
    if (this.state.whosTurn === "player1") {
      const res1 = this.vg.move(c)
      if (res1 === 'isMill') {
        this.openDialog("Gratuliere, du hast gewonnen!")
        return;
      }
      if (res1 === 'isDraw') {
        this.openDialog("Gratuliere, du hast ein Remis geschafft !");
        return;
      }

      // Führe Zug für Computer aus:
      const res2 = this.vg.move(this.vg.bestMove())
      if (res2 === 'isMill') {
        this.openDialog("Bedaure, du hast verloren!")
        return;
      }
      if (res2 === 'isDraw') {
        this.openDialog("Gratuliere, du hast ein Remis geschafft !");
        return;
      }
    }
  }
  
  undo = ()=> this.vg.undo()

  getClass = (row: number, col: number): string => {
    const x = col + this.vg.NCOL * (this.vg.NROW - row - 1);
    // console.log( row, col, x, this.vg.state.grstate[x].occupiedBy)
    if (this.vg.state.board[x] === FieldOccupiedType.player1) return "player1"
    if (this.vg.state.board[x] === FieldOccupiedType.player2) return "player2"
    return ""
  }
}