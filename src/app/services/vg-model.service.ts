import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const clone = (a: {}) => JSON.parse(JSON.stringify(a));
const cloneState = (state: STATE) => clone(state);

export interface STATEOFGAME {
  whoBegins: string,  // Wer fängt an 'player1' oder 'player2'
  maxLev: number,     // Spielstärke
}

export interface STATE {
  moves: number[],             // Spielzüge (Liste der Spalten in die ein Stein geworfen wird.) 
  board: FieldOccupiedType[];  // Spielfeldbelegung
  hcol: number[];              // Höhe der Spalten
  grstate: GR[];               // Zusatnd der Gewinnreihen
  whosTurn: string,            // wer ist dran
  isMill: boolean,             // haben wir 4 in einer Reihe
  bestMove: number,            // bester Zug aus minmax
  cntMoves: number,
}

@Injectable({
  providedIn: 'root'
})
export class VgModelService {
  state: STATE;
  stateOfGame: STATEOFGAME;

  MAXVAL = 100000;
  NCOL = DIM.NCOL;
  NROW = DIM.NROW;
  rangeNCOL = range(this.NCOL);
  ORDER = [3, 4, 2, 5, 1, 6, 0];

  origStateOfGame: STATEOFGAME = {
    whoBegins: 'player1',
    maxLev: 4,
  };

  origState: STATE = { // state that is used for evaluating 
    moves: [],
    board: [],
    hcol: this.rangeNCOL.map(() => 0), // height of cols = [0,0,0,...,0];
    grstate: this.vgmodelstatic.gr.map((g) => ({ ...g, occupiedBy: FieldOccupiedType.empty, cnt: 0 })),
    whosTurn: this.origStateOfGame.whoBegins,
    isMill: false,
    bestMove: -1,
    cntMoves: 0,
  };

  constructor(private vgmodelstatic: VgModelStaticService) {
    this.state = cloneState(this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
    this.init(this.origStateOfGame.whoBegins)
  }

  init = (whoBegins: string) => {
    this.state = cloneState(this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
    this.state.whosTurn = 'player1';
    this.stateOfGame.whoBegins = whoBegins;
  }

  possibleMoves = (state: STATE) => this.rangeNCOL.filter(c => state.hcol[c] < this.NROW);

  transitionGR = (e: number, a: number): number => { // e eingang   a ausgang
    if (a === FieldOccupiedType.empty)
      return e;
    if (a === e)
      return a; // or e
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state) => {

    if (mstate.isMill || mstate.hcol[c] === this.NROW) {
      throw Error(`Die Spalte ${c} ist voll`);
    }

    // update state of gewinnreihen attached in move c
    (this.vgmodelstatic.grs[c + this.NCOL * mstate.hcol[c]] || []).forEach(i => {
      const gr = mstate.grstate[i];
      const occupy = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
      gr.occupiedBy = this.transitionGR(occupy, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      if (gr.cnt >= 4) {
        mstate.isMill = true; // !!!
      }
    });
    mstate.moves.push(c);
    mstate.board[c + this.NCOL * mstate.hcol[c]] = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
    mstate.cntMoves += 1;
    mstate.hcol[c] += 1;
    mstate.whosTurn = mstate.whosTurn === "player1" ? "player2" : "player1";

    return mstate.isMill ? 'isMill' : (mstate.cntMoves === this.NROW * this.NCOL ? 'isDraw' : 'notallowed');
  }

  computeValOfNode = (state: any) => {
    const v = state.grstate.reduce((acc: number, gr: GR) => {
      const n = gr.cnt || 1;
      const factor = 1; //  n === 3 ? vgmodelstatic.gr.val : 1;
      return acc
        + (gr.occupiedBy === FieldOccupiedType.player1 ? n * n * n * factor : 0)
        - (gr.occupiedBy === FieldOccupiedType.player2 ? n * n * n * factor : 0);
    }, 0);
    return state.whosTurn === FieldOccupiedType.player1 ? v : -v;
  }

  miniMax = (state: any, lev: number, alpha: number, beta: number) => { // evaluate state recursively, negamax algorithm!
    state.bestMove = -1;
    if (state.isMill) {
      return -(this.MAXVAL + lev);
    }

    if (lev === 0) {
      return this.computeValOfNode(state);
    }

    const moves = this.possibleMoves(state);
    if (moves.length === 0) {
      return this.computeValOfNode(state);
    }

    let maxVal = alpha;
    const valuesOfMoves = this.rangeNCOL.map(() => alpha);

    for (const m of moves) {
      const lstate = cloneState(state);
      this.move(m, lstate);
      const val = -this.miniMax(lstate, lev - 1, -beta, -maxVal);
      valuesOfMoves[m] = val;
      if (val > maxVal) {
        maxVal = val;
        state.bestMove = m;
        if (maxVal >= beta) {
          break;
        }
      }
    }
    if (lev === this.stateOfGame.maxLev) console.log('LEV:', lev, 'VALS:', valuesOfMoves, 'MAXVAL:', maxVal, 'BESTMOVE', state.bestMove)
    return maxVal;
  }

  bestMove = () => {
    const lstate = cloneState(this.state);
    this.miniMax(lstate, this.stateOfGame.maxLev, -this.MAXVAL, +this.MAXVAL);
    if (lstate.bestMove !== -1)
      return lstate.bestMove;
    // there is no best move, just take first possible,
    return this.possibleMoves(this.state)[0]
  }

  undo() {
    const moves = this.state.moves.slice(0, -2);
    this.init(this.stateOfGame.whoBegins);
    moves.forEach(m => this.move(m))
  }

  restart() {
    this.init(this.stateOfGame.whoBegins);
  }


}
