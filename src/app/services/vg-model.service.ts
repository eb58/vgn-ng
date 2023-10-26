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
  rangeNCOL = range(DIM.NCOL);
  ORDER = [3, 4, 2, 5, 1, 6, 0];

  origStateOfGame: STATEOFGAME = {
    whoBegins: 'player1',
    maxLev: 6,
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

  possibleMoves = (state: STATE) => this.rangeNCOL.filter(c => state.hcol[c] < DIM.NROW);

  transitionGR = (e: FieldOccupiedType, a: FieldOccupiedType): FieldOccupiedType => { // e eingang   a ausgang
    if (a === FieldOccupiedType.empty)
      return e;
    if (a === e)
      return a; // or e
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state):string => {

    if ( mstate.hcol[c] === DIM.NROW) {
      throw Error(`Die Spalte ${c} ist voll`);
    }
    
    if ( mstate.isMill ){
      console.log( "ISMILL")
      return 'isMill';
    } 

    const idxBoard = c + DIM.NCOL * mstate.hcol[c]

    // update state of gewinnreihen attached to idxBoard
    this.vgmodelstatic.grs[idxBoard].forEach(i => {
      const gr = mstate.grstate[i];
      const occupy = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
      gr.occupiedBy = this.transitionGR(occupy, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      if (gr.cnt >= 4) {
        mstate.isMill = true; 
      }
    });
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
    mstate.cntMoves++;
    mstate.hcol[c]++;
    mstate.whosTurn = mstate.whosTurn === "player1" ? "player2" : "player1";

    return mstate.isMill ? 'isMill' : (mstate.cntMoves === DIM.NROW * DIM.NCOL ? 'isDraw' : 'notallowed');
  }

  computeValOfNode = (state: any) => {
    const v = state.grstate.reduce((acc: number, gr: GR) => {
      const n = gr.cnt || 1;
      const factor = n === 3 ? gr.val : 1;
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
      const clonedState = cloneState(state);
      this.move(m, clonedState);
      const val = -this.miniMax(clonedState, lev - 1, -beta, -maxVal);
      valuesOfMoves[m] = val;
      if (val > maxVal) {
        maxVal = val;
        state.bestMove = m;
        if (maxVal >= beta) {
          break;
        }
      }
    }
    if (lev === this.stateOfGame.maxLev) console.log( 'BESTMOVE', state.bestMove, 'MAXVAL:', maxVal, 'VALS:', valuesOfMoves, state.moves)
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

  dumpBoard() {
    const s = range(DIM.NROW).reduce((acc1, r) => {
      return acc1 + range(DIM.NCOL).reduce((acc2, c) => {
        const x = c + DIM.NCOL * (DIM.NROW - r - 1);
        if (this.state.board[x] === 1) return  acc2 + " X ";
        if (this.state.board[x] === 2) return  acc2 + " O "
        return acc2 + " _ ";
      }, "") + "\n"
    }, "")
    console.log( "\n"+ s)
  }

}
