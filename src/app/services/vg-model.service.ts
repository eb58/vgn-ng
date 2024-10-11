import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, GR, VgModelStaticService, DIM } from './vg-model-static.service';

const max = (xs: any[], proj: (a: any) => number = x => x) => xs.reduce((a, x) => (proj(x) > (proj)(a) ? x : a), xs[0])
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);

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

  state: STATE;
  cntNodesEvaluated = 0;
  cache: any = {};

  constructor(private readonly vgmodelstatic: VgModelStaticService) {
    this.state = clone(this.origState);
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
  xvalOfGR = (gr: GR) => gr.val * gr.cnt * gr.occupiedBy === FieldOccupiedType.ai ? 1 : -1

  computeValOfNodeForAI = (state: STATE) =>
    state.grState
      .filter(gr => gr.occupiedBy === FieldOccupiedType.human || gr.occupiedBy === FieldOccupiedType.ai)
      .reduce((acc: number, gr: GR) => acc + this.valOfGR(gr), 0);

  terminalValue = (state: STATE, depth: number, allowedMoves: number[]) => {
    if (state.isMill) return -MAXVAL + (this.gameSettings.maxLev - depth);
    if (allowedMoves.length === 0) return 0
    if (state.grState.filter(gr => gr.occupiedBy === FieldOccupiedType.neutral).length === state.grState.length) return 0;
    // if (depth === 0) return (state.whoseTurn === 'ai' ? 1 : -1) * this.computeValOfNodeForAI(state)
    if (depth === 0) return this.computeValOfNodeForAI(state);
    return undefined
  }

  _minmax = (state: STATE, depth: number, maximizing: boolean): number =>
    this.terminalValue(state, depth, this.generateMoves(state)) ??
      (maximizing)
      ? this.generateMoves(state).reduce((score, move) => Math.max(score, this._minmax(this.move(move, clone(state)), depth - 1, false)), -MAXVAL) :
      this.generateMoves(state).reduce((score, move) => Math.min(score, this._minmax(this.move(move, clone(state)), depth - 1, true)), +MAXVAL)
  minmax = (state: STATE, depth: number, ignore1: number, ignore2: number): number => this._minmax(state, depth, true)

  negamaxSimple = (state: STATE, depth: number, ignore1: number, ignore2: number): number =>  // without alpha/beta-pruning
    this.terminalValue(state, depth, this.generateMoves(state)) ?? this.generateMoves(state).reduce((score, move) => Math.max(score, -this.negamaxSimple(this.move(move, clone(state)), depth - 1, 0, 0)), -MAXVAL)

  negamax = (state: STATE, depth: number, alpha: number, beta: number): number => {
    // evaluate state recursively using negamax algorithm! -> wikipedia
    this.cntNodesEvaluated++;

    const allowedMoves = this.generateMoves(state);

    const tval = this.terminalValue(state, depth, allowedMoves)
    if (tval != undefined) return tval;

    let score = -MAXVAL;
    for (const m of allowedMoves) {
      score = Math.max(score, -this.negamax(this.move(m, clone(state)), depth - 1, -beta, -alpha));
      alpha = Math.max(alpha, score)
      if (alpha >= beta)
        break;
    }
    return score;
  }

  calcBestMoves = (): MoveType[] => {
    const cmp = (a: MoveType, b: MoveType) => b.score - a.score
    this.cntNodesEvaluated = 0;
    const moves = this.generateMoves(this.state);

    // 1. Check if there is a simple Solution...
    const valuesOfMoves1 = moves.map(move => ({ move, score: -this.negamax(this.move(move, clone(this.state)), 2, -MAXVAL, +MAXVAL) })).toSorted(cmp);
    if (valuesOfMoves1[0].score >= MAXVAL - this.gameSettings.maxLev) return valuesOfMoves1// there is a move to win -> take it!
    if (valuesOfMoves1.filter((m: any) => m.score >= -MAXVAL + this.gameSettings.maxLev).length === 1) return valuesOfMoves1 // only one move does not lead to disaster -> take it!

    // 2. Now calculate with full depth!
    return moves.map(move => ({ move, score: -this.negamax(this.move(move, clone(this.state)), this.gameSettings.maxLev, -MAXVAL, +MAXVAL) })).toSorted(cmp)
  }

  mapSym = { [FieldOccupiedType.human]: ' H ', [FieldOccupiedType.ai]: ' C ', [FieldOccupiedType.empty]: ' _ ', [FieldOccupiedType.neutral]: ' § ' };
  dumpBoard = (board: FieldOccupiedType[]): string =>
    range(DIM.NROW).reduce(
      (acc, r) => acc + range(DIM.NCOL).reduce((acc, c) => acc + this.mapSym[board[c + DIM.NCOL * (DIM.NROW - r - 1)]], '') + '\n',
      '\n')

  dumpCacheItem = (s: string) => reshape(s.split('').map(x => this.mapSym[Number(x) as FieldOccupiedType]), 7).reverse().map((x: any) => x.join('')).join('\n')

  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);
  isMill = (): boolean => this.state.isMill
  isDraw = (): boolean => this.state.moves.length === DIM.NCOL * DIM.NROW
  doMoves = (moves: number[]): void => moves.forEach(v => this.move(v));
  restart = (moves: number[] = []) => {
    this.state = clone(this.origState);
    this.state.whoseTurn = this.gameSettings.whoBegins
    this.doMoves(moves)
    if (this.state.whoseTurn === 'ai') {
      const x = this.calcBestMoves()[0]
      console.log(x)
      this.move(x.move)
    }
  }
  undo = () => {
    const moves = this.state.moves.slice(0, -2)
    this.state = clone(this.origState);
    this.state.whoseTurn = this.gameSettings.whoBegins
    this.doMoves(moves)
  }
}
