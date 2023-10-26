import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const max = (xs: any[], proj: (a: any) => number = x => x) => xs.reduce((a, x) => (proj(x) > (proj)(a) ? x : a), xs[0])

const clone = (a: {}) => JSON.parse(JSON.stringify(a));
const cloneState = (state: STATE) => clone(state);

export interface STATEOFGAME {
  whoBegins: string,  // Wer fängt an 'player1' oder 'player2'
  maxLev: number,     // Spielstärke
}

export interface MoveType {
  move: number;
  val: number;
}

const MAXVAL = 100000;

export interface STATE {
  moves: number[],             // Spielzüge - Liste der Spalten (0, 1, ... , 6) in die ein Stein geworfen wird.) 
  board: FieldOccupiedType[];  // Spielfeldbelegung
  heightCol: number[];         // Höhe der Spalten
  grState: GR[];               // Zustand der Gewinnreihen
  whosTurn: string,            // wer ist dran
  isMill: boolean,             // haben wir 4 in einer Reihe
}

@Injectable({
  providedIn: 'root'
})
export class VgModelService {
  state!: STATE;
  stateOfGame!: STATEOFGAME;

  rangeNCOL = range(DIM.NCOL);
  ORDER = [3, 4, 2, 5, 1, 6, 0];

  origStateOfGame: STATEOFGAME = {
    whoBegins: 'player1',
    maxLev: 4,
  };

  origState: STATE = { // state that is used for evaluating 
    moves: [],
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCol: this.rangeNCOL.map(() => 0), // height of cols = [0,0,0,...,0];
    grState: this.vgmodelstatic.gr.map((g) => ({ ...g, occupiedBy: FieldOccupiedType.empty, cnt: 0 })),
    whosTurn: this.origStateOfGame.whoBegins,
    isMill: false,
  };

  constructor(private vgmodelstatic: VgModelStaticService) {
    this.init()
  }

  init = () => {
    this.state = clone(this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
  }

  generateMoves = (state: STATE) => this.rangeNCOL.filter(c => state.heightCol[c] < DIM.NROW);

  transitionGR = (e: FieldOccupiedType, a: FieldOccupiedType): FieldOccupiedType => { // e eingang   a ausgang
    if (a === FieldOccupiedType.empty)
      return e;
    if (a === e)
      return a; // or e
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state): string => {
    if (mstate.isMill) return 'finished'
    if (mstate.heightCol[c] === DIM.NROW) return 'notallowed'

    const idxBoard = c + DIM.NCOL * mstate.heightCol[c]

    // update state of gewinnreihen attached to idxBoard
    this.vgmodelstatic.grs[idxBoard].forEach(i => {
      const gr = mstate.grState[i];
      const occupy = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
      gr.occupiedBy = this.transitionGR(occupy, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      if (gr.cnt >= 4) {
        mstate.isMill = true;
      }
    });
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whosTurn === 'player1' ? FieldOccupiedType.player1 : FieldOccupiedType.player2;
    mstate.heightCol[c]++;
    mstate.whosTurn = mstate.whosTurn === "player1" ? "player2" : "player1";

    return mstate.isMill ? 'isMill' : (mstate.moves.length === DIM.NROW * DIM.NCOL ? 'isDraw' : '');
  }

  computeValOfNode = (state: STATE) => {
    const v = state.grState
      .filter(gr => gr.occupiedBy === FieldOccupiedType.player1 || gr.occupiedBy === FieldOccupiedType.player2)
      .reduce((acc: number, gr: GR) => {
        const n = gr.cnt || 1;
        const factor = n === 3 ? gr.val : 1;
        return acc
          + (gr.occupiedBy === FieldOccupiedType.player1 ? n * n * factor : 0)
          - (gr.occupiedBy === FieldOccupiedType.player2 ? n * n * factor : 0);
      }, 0);
    return state.whosTurn === 'player1' ? v : -v;
  }


  miniMax = (state: STATE, lev: number, alpha: number, beta: number) => { // evaluate state recursively, negamax algorithm!
    if (state.isMill) {
      return -(MAXVAL + lev);
    }

    if (lev === 0) {
      return this.computeValOfNode(state);
    }

    const possibleMoves = this.generateMoves(state);
    if (possibleMoves.length === 0) {
      return 0;
    }

    let value = -MAXVAL;
    for (const m of possibleMoves) {
      const clonedState = clone(state);
      this.move(m, clonedState);
      value = max([value, -this.miniMax(clonedState, lev - 1, -beta, -alpha)]);
      alpha = max([alpha, value])
      if (alpha >= beta)
        break;
    }
    return value;
  }

  calcBestMove = (): MoveType => {
    const moves = this.generateMoves(this.state);
    const valuesOfMoves = moves.map(move => {
      const clonedState = clone(this.state);
      this.move(move, clonedState);
      return { move, val: -this.miniMax(clonedState, this.stateOfGame.maxLev, -MAXVAL, +MAXVAL) };
    })
    const bestMove = max(valuesOfMoves, (v) => v.val)
    console.log(
      'BESTMOVE', bestMove?.move,
      'MAXVAL:', bestMove?.val,
      'VALS:', valuesOfMoves.reduce((acc: any[], v) => { acc[v.move] = v.val; return acc }, []), this.state.moves
    )
    return bestMove;
  }

  undo() {
    const moves = this.state.moves.slice(0, -2);
    this.init();
    moves.forEach(m => this.move(m))
  }

  restart() {
    this.init();
  }

  dumpBoard() {
    const s = range(DIM.NROW).reduce((acc1, r) => {
      return acc1 + range(DIM.NCOL).reduce((acc2, c) => {
        const x = c + DIM.NCOL * (DIM.NROW - r - 1);
        if (this.state.board[x] === 1) return acc2 + " X ";
        if (this.state.board[x] === 2) return acc2 + " O "
        return acc2 + " _ ";
      }, "") + "\n"
    }, "")
    console.log("\n" + s)
  }

}
