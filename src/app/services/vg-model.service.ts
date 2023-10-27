import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const max = (xs: any[], proj: (a: any) => number = x => x) => xs.reduce((a, x) => (proj(x) > (proj)(a) ? x : a), xs[0])
const clone = (a: {}) => JSON.parse(JSON.stringify(a));

export interface STATEOFGAME {
  whoBegins: string,  // Wer fängt an 'human' oder 'computer'
  maxLev: number,     // Spielstärke
}
export interface STATE {
  moves: number[],             // Spielzüge - Liste der Spalten (0, 1, ... , 6) in die ein Stein geworfen wird.) 
  board: FieldOccupiedType[];  // Spielfeldbelegung
  heightCol: number[];         // Höhe der Spalten
  grState: GR[];               // Zustand der Gewinnreihen
  whoseTurn: string,           // wer ist dran: human or computer
  isMill: boolean,             // haben wir 4 in einer Reihe
}

export interface MoveType {
  move: number;
  val: number;
}

const MAXVAL = 100000;
const ORDER = [3, 4, 2, 5, 1, 6, 0]

@Injectable({
  providedIn: 'root'
})
export class VgModelService {
  origStateOfGame: STATEOFGAME = {
    whoBegins: 'human',
    maxLev: 6,
  };

  origState: STATE = { // state that is used for evaluating 
    moves: [],
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCol: range(DIM.NCOL).map(() => 0), // height of cols = [0,0,0,...,0];
    grState: this.vgmodelstatic.gr.map((g) => ({ ...g, occupiedBy: FieldOccupiedType.empty, cnt: 0 })),
    whoseTurn: this.origStateOfGame.whoBegins,
    isMill: false,
  };

  state: STATE = clone(this.origState);
  stateOfGame: STATEOFGAME = clone(this.origStateOfGame);

  constructor(private vgmodelstatic: VgModelStaticService) {
    this.init()
  }

  init = () => {
    this.state = clone(this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
  }

  generateAllowedMoves = (state: STATE) => ORDER.filter(c => state.heightCol[c] < DIM.NROW);

  transitionGR = (e: FieldOccupiedType, a: FieldOccupiedType): FieldOccupiedType => { // e eingang   a ausgang
    if (a === FieldOccupiedType.empty)
      return e;
    if (a === e)
      return a; // or e
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state) => {

    const idxBoard = c + DIM.NCOL * mstate.heightCol[c]

    // update state of gewinnreihen attached to idxBoard
    this.vgmodelstatic.grs[idxBoard].forEach(i => {
      const gr = mstate.grState[i];
      const occupy = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.computer;
      gr.occupiedBy = this.transitionGR(occupy, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      if (gr.cnt >= 4) {
        mstate.isMill = true;
      }
    });
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.computer;
    mstate.heightCol[c]++;
    mstate.whoseTurn = mstate.whoseTurn === "human" ? "computer" : "human";
  }

  computeValOfNode = (state: STATE) => {
    const v = state.grState
      .filter(gr => gr.occupiedBy === FieldOccupiedType.human || gr.occupiedBy === FieldOccupiedType.computer)
      .reduce((acc: number, gr: GR) => {
        const n = gr.cnt || 1;
        const factor = n === 3 ? gr.val : 1;
        return acc
          + (gr.occupiedBy === FieldOccupiedType.human ? n * n * factor : 0)
          - (gr.occupiedBy === FieldOccupiedType.computer ? n * n * factor : 0);
      }, 0);
    return state.whoseTurn === 'human' ? v : -v;
  }


  miniMax = (state: STATE, lev: number, alpha: number, beta: number) => { // evaluate state recursively, negamax algorithm!
    if (state.isMill) {
      return -(MAXVAL + lev);
    }

    if (lev === 0) {
      return this.computeValOfNode(state);
    }

    const allowdMoves = this.generateAllowedMoves(state);
    if (allowdMoves.length === 0) {
      return this.computeValOfNode(state);
    }

    let value = alpha;
    for (const m of allowdMoves) {
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
    const moves = this.generateAllowedMoves(this.state);

    // 1. Prüfe ob es eine einfache Lösung gibt...
    const valuesOfMoves1 = moves.map(move => {
      const clonedState = clone(this.state);
      this.move(move, clonedState);
      return { move, val: -this.miniMax(clonedState, 2, -MAXVAL, +MAXVAL) };
    })

    if (max(valuesOfMoves1, (v) => v.val).val >= MAXVAL )
      return max(valuesOfMoves1, (v) => v.val)

    if( valuesOfMoves1.filter( m => m.val > -10000 ).length === 1 ){
      // nur ein Zug ist kein Verlustzug!
      return max(valuesOfMoves1, (v) => v.val)
    }

    // 2. Jetzt mit voller Suchtiefe
    const valuesOfMoves2 = moves.map(move => {
      const clonedState = clone(this.state);
      this.move(move, clonedState);
      return { move, val: -this.miniMax(clonedState, this.stateOfGame.maxLev, -MAXVAL, +MAXVAL) };
    })

    const bestMove = max(valuesOfMoves2, (v) => v.val)
    console.log(
      'BESTMOVE', bestMove?.move,
      'MAXVAL:', bestMove?.val,
      'VALS:', valuesOfMoves2.reduce((acc: any[], v) => { acc[v.move] = v.val; return acc }, []), this.state.moves
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
        if (this.state.board[x] === FieldOccupiedType.computer) return acc2 + " X ";
        if (this.state.board[x] === FieldOccupiedType.human) return acc2 + " O "
        return acc2 + " _ ";
      }, "") + "\n"
    }, "")
    console.log("\n" + s)
  }

  isMill = () => this.state.isMill
  isRemis = () => this.state.moves.length === DIM.NCOL * DIM.NROW

}
