import { Injectable } from '@angular/core';
import { range, FieldOccupiedType, WinningRow, ConnectFourModelStaticService, DIM } from './connect4-model-static.service';

const cmpByScore = (a: MoveType, b: MoveType) => b.score - a.score
const reshape = (m: any, dim: number) => m.reduce((acc: any, x: any, i: number) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, []);
const cloneState = (s: STATE) => ({
  ...s,
  moves: [...s.moves],
  board: [...s.board],
  heightCols: [...s.heightCols],
  winningRowsState: s.winningRowsState.map((wr: WinningRow) => ({ ...wr, row: [...wr.row] }))
})

type Player = 'human' | 'ai'

export type GameSettings = {
  whoBegins: Player,
  maxLev: number,     // maximum skill level
}

export type STATE = {
  hash: string;
  moves: number[],                // moves - list of columns (0, 1, ... , 6) 
  board: FieldOccupiedType[];     // state of board
  heightCols: number[];           // height of columns
  winningRowsState: WinningRow[]; // state of winning rows
  whoseTurn: Player               // who's turn is it: human or ai
  isMill: boolean,                // we have four in a row!
}

export type MoveType = {
  move: number;
  score: number;
}

const MAXVAL = 1000000;
const ORDER = Object.freeze([3, 4, 2, 5, 1, 6, 0])

@Injectable({ providedIn: 'root' })
export class ConnectFourModelService {
  gameSettings: GameSettings = { whoBegins: 'human', maxLev: 5 };

  origState: STATE = { // state that is used for evaluating 
    board: range(DIM.NCOL * DIM.NROW).map(() => 0),
    heightCols: range(DIM.NCOL).map(() => 0), // height of cols = [0, 0, 0, ..., 0];
    winningRowsState: this.vgmodelstatic.allWinningRows,
    whoseTurn: this.gameSettings.whoBegins,
    isMill: false,
    hash: '',
    moves: [],
  };

  state: STATE;
  cntNodesEvaluated = 0;
  cache: any = {};

  constructor(private readonly vgmodelstatic: ConnectFourModelStaticService) {
    this.state = cloneState(this.origState);
  }

  transitionGR = (i: FieldOccupiedType, o: FieldOccupiedType): FieldOccupiedType => { // i in / o out
    if (o === FieldOccupiedType.empty) return i;
    if (i === o) return i; // or o
    return FieldOccupiedType.neutral;
  }

  move = (c: number, mstate: STATE = this.state) => {
    const idxBoard = c + DIM.NCOL * mstate.heightCols[c]

    // update state of gewinnreihen attached to idxBoard
    this.vgmodelstatic.winningRowsForFields[idxBoard].forEach(i => {
      const wrState = mstate.winningRowsState[i];
      const occupy = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.ai;
      wrState.occupiedBy = this.transitionGR(occupy, wrState.occupiedBy);
      wrState.cnt += (wrState.occupiedBy !== FieldOccupiedType.neutral) ? 1 : 0;
      mstate.isMill ||= wrState.cnt >= 4;

    });
    mstate.moves.push(c);
    mstate.board[idxBoard] = mstate.whoseTurn === 'human' ? FieldOccupiedType.human : FieldOccupiedType.ai;
    mstate.heightCols[c]++;
    mstate.whoseTurn = mstate.whoseTurn === 'human' ? 'ai' : 'human';
    mstate.hash = mstate.board.join('')
    return mstate;
  }

  scoreOfWinningRow = (wr: WinningRow) => (wr.occupiedBy === FieldOccupiedType.ai ? 1 : -1) * wr.score * wr.cnt

  computeScoreOfNodeForAI = (state: STATE) =>
    state.winningRowsState
      .filter(wr => wr.occupiedBy === FieldOccupiedType.human || wr.occupiedBy === FieldOccupiedType.ai)
      .reduce((acc: number, wr: WinningRow) => acc + this.scoreOfWinningRow(wr), 0);


  isTerminalState = (state: STATE, allowedMoves: number[], depth: number) => allowedMoves.length === 0 || state.isMill || depth === 0;

  scoreOfTerminalStateForAI = (state: STATE, depth: number, allowedMoves: number[]) => {
    if (allowedMoves.length === 0) return 0
    if (state.isMill) return -MAXVAL;
    if (depth === 0) return this.computeScoreOfNodeForAI(state);
    return 0
  }

  negamax = (state: STATE, depth: number, alpha: number, beta: number): number => { // evaluate state recursively using negamax algorithm! -> wikipedia
    const allowedMoves = this.generateMoves(state);

    if (this.isTerminalState(state, allowedMoves, depth)) {
      this.cntNodesEvaluated++;
      return this.scoreOfTerminalStateForAI(state, depth, allowedMoves)
    }

    let score = -MAXVAL;
    for (const m of allowedMoves) {
      score = Math.max(score, -this.negamax(this.move(m, cloneState(state)), depth - 1, -beta, -alpha));
      alpha = Math.max(alpha, score)
      if (alpha >= beta)
        break;
    }
    return score;
  }

  calcBestMoves = (): MoveType[] => {
    this.cntNodesEvaluated = 0;
    const moves = this.generateMoves(this.state);

    // 1. Check if there is a simple Solution...
    const scoresOfMoves1 = moves.map(move => ({ move, score: -this.negamax(this.move(move, cloneState(this.state)), 3, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore);
    if (scoresOfMoves1[0]?.score >= MAXVAL) return scoresOfMoves1// there is a move to win -> take it!
    if (scoresOfMoves1.filter((m) => m.score >= -MAXVAL).length === 1) return scoresOfMoves1 // only one move does not lead to disaster -> take it!

    // 2. Now calculate with full depth!
    return moves.map(move => ({ move, score: -this.negamax(this.move(move, cloneState(this.state)), this.gameSettings.maxLev, -MAXVAL, +MAXVAL) })).toSorted(cmpByScore)
  }

  mapSym = { [FieldOccupiedType.human]: ' H ', [FieldOccupiedType.ai]: ' C ', [FieldOccupiedType.empty]: ' _ ', [FieldOccupiedType.neutral]: ' § ' };
  dumpBoard = (board: FieldOccupiedType[], s = ""): void =>
    console.log(s, range(DIM.NROW).reduce(
      (acc, r) => acc + range(DIM.NCOL).reduce((acc, c) => acc + this.mapSym[board[c + DIM.NCOL * (DIM.NROW - r - 1)]], '') + '\n',
      '\n'))

  dumpCacheItem = (s: string) => reshape(s.split('').map(x => this.mapSym[Number(x) as FieldOccupiedType]), 7).reverse().map((x: any) => x.join('')).join('\n')

  generateMoves = (state: STATE): number[] => ORDER.filter(c => state.heightCols[c] < DIM.NROW);
  isMill = (): boolean => this.state.isMill
  isDraw = (): boolean => this.state.moves.length === DIM.NCOL * DIM.NROW
  doMoves = (moves: number[]): void => moves.forEach(v => this.move(v));
  init = (moves: number[]) => {
    this.state = cloneState(this.origState);
    this.state.whoseTurn = this.gameSettings.whoBegins
    this.doMoves(moves)
  }
  restart = (moves: number[] = []) => {
    this.init(moves)
    if (this.state.whoseTurn === 'ai') {
      const x = this.calcBestMoves()[0]
      console.log(x)
      this.move(x.move)
    }
  }
  undo = () => this.init(this.state.moves.slice(0, -2))
}