import { Injectable } from '@angular/core';
import { GR, VgModelStaticService } from './vg-model-static.service';

const range = (n:number) => [...Array(n).keys()]
const clone = (a:{}) => JSON.parse(JSON.stringify(a));
const cloneState = (state:STATE) => clone(state);

export interface STATE{
  hcol: number[];
  grstate: GR[];
  whosTurn: number,
  isMill: boolean,
  bestMove: number,
  cntMoves: number,
 }
 

@Injectable({
  providedIn: 'root'
})
export class VgModelService {

  constructor(private vgmodelstatic: VgModelStaticService) { 
    this.state = cloneState( this.origState);
    this.stateOfGame = clone( this.origStateOfGame);
    this.state.whosTurn = this.STYP.player1;
    this.stateOfGame.whoBegins = this.STYP.player1;
  }

  MAXVAL = 100000;
  NCOL = this.vgmodelstatic.DIM.NCOL;
  NROW = this.vgmodelstatic.DIM.NROW;
  STYP = this.vgmodelstatic.STYP;
  rangeNCOL = range(this.NCOL);
  ORDER = [3, 4, 2, 5, 1, 6, 0];

  origStateOfGame = {
    whoBegins: 'player1',
    maxLev: 4,
    courseOfGame: [],
  };

   origState:STATE = { // state that is used for evaluating 
    hcol: this.rangeNCOL.map(() => 0), // height of cols = [0,0,0,...,0];
    grstate: this.vgmodelstatic.gr.map((g) => ({...g, occupiedBy: this.STYP.empty, cnt: 0 })),
    whosTurn: this.origStateOfGame.whoBegins === 'player1' ? this.STYP.player1 : this.STYP.player2,
    isMill: false,
    bestMove: -1,
    cntMoves: 0,
  };

  state: STATE;
  stateOfGame: any;

   init = (whoBegins:string) => {
    this.state = cloneState( this.origState);
    this.stateOfGame = clone(this.origStateOfGame);
    this.state.whosTurn = whoBegins === 'player1' ? this.STYP.player1 : this.STYP.player2;
    this.stateOfGame.whoBegins = whoBegins;
  }

  possibleMoves = (state:STATE) => this.rangeNCOL.filter(c => state.hcol[c] < this.NROW);

   transitionGR = (e:number, a:number):number => { // e eingang   a ausgang
    if (a === this.STYP.empty)
      return e;
    if (a === e)
      return a; // or e
    if (a !== e)
      return this.STYP.neutral;
    return this.STYP.neutral;
  }

  move = (c:number, mstate:STATE) => {
    mstate = mstate || this.state;

    if (mstate.isMill || mstate.hcol[c] === this.NROW) {
      return 'notallowed';
    }

    // update state of gewinnreihen attached in move c
    const grs = this.vgmodelstatic.grs[c + this.NCOL * mstate.hcol[c]] || [];
    grs.forEach((gr:GR) => {
      gr.occupiedBy = this.transitionGR(mstate.whosTurn, gr.occupiedBy);
      gr.cnt += (gr.occupiedBy !== this.STYP.neutral)?1:0;
      if (gr.cnt >= 4) {
        mstate.isMill = true; // !!!
      }
    });
    mstate.cntMoves += 1;
    mstate.hcol[c] += 1;
    mstate.whosTurn = mstate.whosTurn === this.STYP.player1 ?this.STYP.player2 : this.STYP.player1;

    return mstate.isMill ? 'isMill' : (mstate.cntMoves === this.NROW * this.NCOL ? 'draw' : 'notallowed');
  }

  computeValOfNode = (state:any) => {
    const v = state.grstate.reduce((acc:number, gr:GR) => {
      const n = gr.cnt || 1;
      const factor = 1; //  n === 3 ? vgmodelstatic.gr.val : 1;
      return acc
        + (gr.occupiedBy === this.STYP.player1 ? n * n * n * factor : 0)
        - (gr.occupiedBy === this.STYP.player2 ? n * n * n * factor : 0);
    }, 0);
    return state.whosTurn === this.STYP.player1 ? v : -v;
  }

   miniMax = (state:any, lev:number, alpha:number, beta:number) => { // evaluate state recursively, negamax algorithm!
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
    // console.log('LEV:', lev, 'VALS:', valuesOfMoves, 'MAXVAL:', maxVal, 'BESTMOVE', state.bestMove)
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

}
