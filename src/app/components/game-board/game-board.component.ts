import { Component } from '@angular/core';
import { STATE, STATEOFGAME, VgModelService } from '../../services/vg-model.service';
import { DIM, FieldOccupiedType, range } from '../../services/vg-model-static.service';
import { InfoDialog } from '../info-dialog/info-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { QuestionDialogComponent } from '../question-dialog/question-dialog.component';
import { Observable, filter } from 'rxjs';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

const doMoves = (s:VgModelService, moves:number[]) => moves.forEach(v => s.move(v));

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent {
  info = 'Bitte klicke in die Spalte, in die du einen Stein einwerfen möchtest.'

  state: STATE;
  stateOfGame: STATEOFGAME;
  NROW = range(DIM.NROW);
  NCOL = range(DIM.NCOL);

  constructor(private vg: VgModelService, public dialog: MatDialog) {
    this.state = vg.state
    this.stateOfGame = vg.stateOfGame
  }

  openDialog(info: string): void {
    const position = { top: '50%', left: '30%' }
    this.dialog.open(InfoDialog, { position, data: { title: "Info", info } });
  }

  openQuestionDialog(question: string): Observable<any> {
    const position = { top: '50%', left: '30%' }
    const dialogRef = this.dialog.open(QuestionDialogComponent, { position, data: { title: "Frage", question } });
    return dialogRef.afterClosed()
  }

  openSettingsDialog(stateOfGame: STATEOFGAME): Observable<any> {
    const position = { top: '50%', left: '30%' }
    const dialogRef = this.dialog.open(SettingsDialogComponent, { position, data: stateOfGame });
    return dialogRef.afterClosed()
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

  undoMove = () => this.vg.undo()

  restartGame = () => {
    this.openQuestionDialog("Wirklich neu starten?")
      .pipe(filter(res => res === "ja"))
      .subscribe(() => {
        this.vg.restart()
        // just for test 
        // doMoves(this.vg, [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
      })
  }

  openSettings = () => {
    this.openSettingsDialog(this.vg.origStateOfGame)
      .pipe(filter(res => !!res))
      .subscribe(res => this.stateOfGame = res)
  }

  getClass = (row: number, col: number): string => {
    const x = col + this.vg.NCOL * (this.vg.NROW - row - 1);
    // console.log( row, col, x, this.vg.state.grstate[x].occupiedBy)
    if (this.vg.state.board[x] === FieldOccupiedType.player1) return "player1"
    if (this.vg.state.board[x] === FieldOccupiedType.player2) return "player2"
    return ""
  }
}