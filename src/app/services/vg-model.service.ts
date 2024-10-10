import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const max = (xs: any[], proj: (a: any) => number = x => x) => xs.reduce((a, x) => (proj(x) > (proj)(a) ? x : a), xs[0])
const clone = (a: {}) => JSON.parse(JSON.stringify(a));

export type Player = 'human' | 'ai'

export type GameSettings = {
  whoBegins: Player,
  maxLev: number,     // maximum skill level
}

export type STATE = {
  hash: string;
  moves: number[],            // moves - list of columns (0, 1, ... , 6) 
  board: FieldOccupiedType[]; // state of board
  heightCols: number[];       // height of columns
  grState: GR[];              // state of winning rows
  whoseTurn: Player           // who's turn is it: human or ai
  isMill: boolean,            // we have four in a row!
}

export type MoveType = {
  move: number;
  score: number;
}

const MAXVAL = 1000000;
const ORDER = Object.freeze([3, 4, 2, 5, 1, 6, 0])

@Injectable({ providedIn: 'root' })
export class VgModelService {
  gameSettings: GameSettings = { whoBegins: 'human', maxLev: 5 };

  origState: STATE = { // state that is used for evaluating 
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    grState: this.vgmodelstatic.gr.map((g) => ({ ...g, occupiedBy: FieldOccupiedType.empty, cnt: 0 })),
    whoseTurn: this.gameSettings.whoBegins,
    isMill: false,
    hash: '',
    moves: [],
  };

  state: STATE = clone(this.origState);
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
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.ai;
    mstate.heightCols[c]++;
    mstate.whoseTurn = mstate.whoseTurn === 'human' ? 'ai' : 'human';
    mstate.hash = mstate.board.join('')
    return mstate;
  }

  valOfGR = (gr: GR) => {
    const n = gr.cnt * gr.cnt || 1;
    const factor = n === 3 ? gr.val : 1;
    return gr.occupiedBy === FieldOccupiedType.ai ? n * factor : 0 - gr.occupiedBy === FieldOccupiedType.human ? n * factor : 0
  }

  computeValOfNodeForAI = (state: STATE) =>
    state.grState
      .filter(gr => gr.occupiedBy === FieldOccupiedType.human || gr.occupiedBy === FieldOccupiedType.ai)
      .reduce((acc: number, gr: GR) => acc + this.valOfGR(gr), 0);

  negamaxSimple = (state: STATE, depth: number, ignore1: number, ignore2: number): number => { // without alpha/beta-pruning
    if (state.isMill) return -MAXVAL - depth;
    if (state.moves.length >= DIM.NCOL * DIM.NROW) return 0
    if (depth <= 0) return this.computeValOfNodeForAI(state);
    return this.generateMoves(state).reduce((score, move) => Math.max(score, -this.negamaxSimple(this.move(move, clone(state)), depth - 1, 0, 0)), -MAXVAL)
  }

  negamax = (state: STATE, depth: number, alpha: number, beta: number): number => {
    // evaluate state recursively using negamax algorithm! -> wikipedia

    if (this.cache[state.hash]) {
      // console.log('FROM CACHE! Cache size is ', Object.keys(this.cache).length, state.hash, this.cache[state.hash],  this.cache)
      return this.cache[state.hash]
    }

    this.cntNodesEvaluated++;

    if (state.isMill) {
      this.cache[state.hash] = -MAXVAL
      return -MAXVAL - depth;
    }

    const heuristicVal = this.computeValOfNodeForAI(state)
    if (depth <= 0) return state.whoseTurn === 'ai' ? heuristicVal : -heuristicVal;

    if (state.grState.filter(gr => gr.occupiedBy === FieldOccupiedType.neutral).length === state.grState.length) {
      console.log('AAAAAAAAAAAAAAAAAAAA')
      return 0;
    }

    const allowedMoves = this.generateMoves(state);
    if (allowedMoves.length === 0) return 0;

    let score = -MAXVAL;
    for (const m of allowedMoves) {
      score = Math.max(score, -this.negamax(this.move(m, clone(state)), depth - 1, -beta, -alpha));
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
    const valuesOfMoves1 = moves.map(move => ({ move, score: -this.negamax(this.move(move, clone(this.state)), 3, -MAXVAL, +MAXVAL) }));
    if (max(valuesOfMoves1, (v) => v.score).score >= MAXVAL) return max(valuesOfMoves1, (v) => v.score) // there is a move to win -> take it!
    if (valuesOfMoves1.filter(m => m.score > -MAXVAL).length === 1) return max(valuesOfMoves1, (v) => v.score) // only one move does not lead to disaster -> take it!


    // 2. Now calculate with full depth!
    valuesOfMoves1.sort((a, b) => b.score - a.score) // sort to eval best moves first
    const valuesOfMoves2 = valuesOfMoves1.map((m: MoveType) => m.move).map(move => ({ move, score: -this.negamax(this.move(move, clone(this.state)), this.gameSettings.maxLev, -MAXVAL, +MAXVAL) }));
    const bestMove = max(valuesOfMoves2, (v) => v.score)

    console.log(
      'BESTMOVE', bestMove,
      'SCORES:', valuesOfMoves2.reduce((acc: any, v) => { acc[v.move + ''] = v.score; return acc }, {}),
      'MOVES-DONE:', this.state.moves,
      'COUNTNODES', this.cntNodesEvaluated,
    )
    return bestMove;
  }

  mapSym = { [FieldOccupiedType.ai]: ' X ', [FieldOccupiedType.human]: ' O ', [FieldOccupiedType.empty]: ' _ ', [FieldOccupiedType.neutral]: ' § ' };
  fieldSymbol = (x: FieldOccupiedType): string => this.mapSym[x]
  dumpBoard = (board: FieldOccupiedType[]): string =>
    range(DIM.NROW).reduce(
      (acc, r) => acc + range(DIM.NCOL).reduce((acc, c) => acc + this.fieldSymbol(board[c + DIM.NCOL * (DIM.NROW - r - 1)]), '') + '\n',
      '')

  init = (moves: number[] = []) => {
    this.state = clone(this.origState);
    this.doMoves(moves)
  }

  restart = (moves: number[] = []) => {
    this.init(moves);
    this.state.whoseTurn = this.gameSettings.whoBegins
    if (this.state.whoseTurn === 'ai') this.move(this.calcBestMove().move)
  }
  undo = () => this.init(this.state.moves.slice(0, -2));
  doMoves = (moves: number[]): void => moves.forEach(v => this.move(v));
  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);
  isMill = (): boolean => this.state.isMill
  isRemis = (): boolean => this.state.moves.length === DIM.NCOL * DIM.NROW
}
