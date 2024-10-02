import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const max = (xs: any[], proj: (a: any) => number = x => x) => xs.reduce((a, x) => (proj(x) > (proj)(a) ? x : a), xs[0])
const clone = (a: {}) => JSON.parse(JSON.stringify(a));

export interface STATEOFGAME {
  whoBegins: 'human' | 'ai',
  maxLev: number,     // skill level
}

export interface STATE {
  hash: string;
  moves: number[],            // moves - list of columns (0, 1, ... , 6) 
  board: FieldOccupiedType[]; // state of board
  heightCols: number[];       // height of columns
  grState: GR[];              // state of winning rows
  whoseTurn: 'human' | 'ai'   // who's turn is it: human or ai
  isMill: boolean,            // we have four in a row!
}

export interface MoveType {
  move: number;
  val: number;
}

const MAXVAL = 100000;
const ORDER = [3, 4, 2, 5, 1, 6, 0]

@Injectable({ providedIn: 'root' })
export class VgModelService {
  origStateOfGame: STATEOFGAME = { whoBegins: 'human', maxLev: 6 };

  origState: STATE = { // state that is used for evaluating 
    hash: "",
    moves: [],
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    grState: this.vgmodelstatic.gr.map((g) => ({ ...g, occupiedBy: FieldOccupiedType.empty, cnt: 0 })),
    whoseTurn: this.origStateOfGame.whoBegins,
    isMill: false,
  };

  state: STATE = clone(this.origState);
  stateOfGame: STATEOFGAME = clone(this.origStateOfGame);
  cntNodesEvaluated = 0;
  cache: any = {};

  constructor(private readonly vgmodelstatic: VgModelStaticService) {
    this.init()
  }

  transitionGR = (i: FieldOccupiedType, o: FieldOccupiedType): FieldOccupiedType => { // i in / o out
    if (o === FieldOccupiedType.empty) return i;
    if (i === o) return i; // or o
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state) => {
    const idxBoard = c + DIM.NCOL * mstate.heightCols[c]

    // update state of gewinnreihen attached to idxBoard
    this.vgmodelstatic.grs[idxBoard].forEach(i => {
      const gr = mstate.grState[i];
      const occupy = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.ai;
      gr.occupiedBy = this.transitionGR(occupy, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      mstate.isMill ||= gr.cnt >= 4;

    });
    mstate.hash = mstate.hash + c;
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.ai;
    mstate.heightCols[c]++;
    mstate.whoseTurn = mstate.whoseTurn === "human" ? "ai" : "human";
    return mstate;
  }

  computeValOfNodeForHuman = (state: STATE) => {
    const v = state.grState
      .filter(gr => gr.occupiedBy === FieldOccupiedType.human || gr.occupiedBy === FieldOccupiedType.ai)
      .reduce((acc: number, gr: GR) => {
        const n = gr.cnt || 1;
        const factor = n === 3 ? gr.val : 1;
        return acc
          + (gr.occupiedBy === FieldOccupiedType.human ? n * n * factor : 0)
          - (gr.occupiedBy === FieldOccupiedType.ai ? n * n * factor : 0);
      }, 0);
    return state.whoseTurn === 'human' ? v : -v;
  }

  // evaluate state recursively using negamax algorithm!
  negamax = (state: STATE, depth: number, alpha: number, beta: number): number => {
    if (this.cache[state.hash]) {
      // console.log("FROM CACHE! Cache size is ", Object.keys(this.cache).length )
      return this.cache[state.hash]
    }

    this.cntNodesEvaluated++;

    if (state.isMill) {
      this.cache[state.hash] = -MAXVAL - depth
      return -MAXVAL - depth;
    }

    if (depth <= 0) return this.computeValOfNodeForHuman(state); // ??? vorzeichen???

    const allowedMoves = this.generateMoves(state);
    if (allowedMoves.length === 0) return this.computeValOfNodeForHuman(state);

    let score = alpha;
    for (const m of allowedMoves) {
      const newState = this.move(m, clone(state));
      score = Math.max(score, -this.negamax(newState, depth - 1, -beta, -alpha));
      alpha = Math.max(alpha, score)
      if (alpha >= beta)
        break;
    }
    return score;
  }

  calcBestMove = (): MoveType => {
    this.cntNodesEvaluated = 0;
    const moves = this.generateMoves(this.state);

    // 1. Check if there is a simple Solution...
    const valuesOfMoves1 = moves.map(move => {
      const clonedState = this.move(move, clone(this.state));
      return { move, val: -this.negamax(clonedState, 2, -MAXVAL, +MAXVAL) };
    })

    if (max(valuesOfMoves1, (v) => v.val).val >= MAXVAL) // there is a move to win
      return max(valuesOfMoves1, (v) => v.val)

    if (valuesOfMoves1.filter(m => m.val > -MAXVAL).length === 1) // only one move does not lead to disaster
      return max(valuesOfMoves1, (v) => v.val)

    // 2. Now with full depth!
    valuesOfMoves1.sort((a, b) => b.val - a.val)
    console.log("AAA", valuesOfMoves1)

    const valuesOfMoves2 = valuesOfMoves1.map(x => x.move).map(move => {
      const clonedState = this.move(move, clone(this.state));
      return { move, val: -this.negamax(clonedState, this.stateOfGame.maxLev, -MAXVAL, +MAXVAL) };
    })

    console.log("BBB", valuesOfMoves1)


    const bestMove = max(valuesOfMoves2, (v) => v.val)
    console.log(
      "COUNTNODES", this.cntNodesEvaluated,
      'BESTMOVE', bestMove?.move,
      'MAXVAL:', bestMove?.val,
      'VALS:', valuesOfMoves2.reduce((acc: any[], v) => { acc[v.move] = v.val; return acc }, []),
      'MOVES-DONE:', this.state.moves
    )
    return bestMove;
  }

  dumpBoard() {
    const s = range(DIM.NROW).reduce((acc1, r) => {
      return acc1 + range(DIM.NCOL).reduce((acc2, c) => {
        const x = c + DIM.NCOL * (DIM.NROW - r - 1);
        if (this.state.board[x] === FieldOccupiedType.ai) return acc2 + " X ";
        if (this.state.board[x] === FieldOccupiedType.human) return acc2 + " O "
        return acc2 + " _ ";
      }, "") + "\n"
    }, "")
    console.log("\n" + s)
  }

  init = (moves: number[] = []) => {
    this.state = clone(this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
    this.doMoves(moves)
  }

  restart = (moves: number[] = []) => this.init(moves);
  undo = () => this.init(this.state.moves.slice(0, -2));
  doMoves = (moves: number[]): void => moves.forEach(v => this.move(v));
  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW); 
  isMill = (): boolean => this.state.isMill
  isRemis = (): boolean => this.state.moves.length === DIM.NCOL * DIM.NROW
}
