import { TestBed } from '@angular/core/testing';

import { VgModelService } from './vg-model.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

const doMoves = (s:VgModelService, moves:number[]) => moves.forEach(v => s.move(v));

describe('VgModelService', () => {
  let vg: VgModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas:[CUSTOM_ELEMENTS_SCHEMA]});
    vg = TestBed.inject(VgModelService);
  });

  it('should be created', () => {
    expect(vg).toBeTruthy();
  });

  it('should be initialized correctly', () => {
    expect(vg.NCOL).toEqual(7);
    expect(vg.stateOfGame.maxLev).toEqual(4);
    expect(vg.stateOfGame.whoBegins).toEqual("player1");
  });

  it('should work correctly', () => {
    expect(vg.move(0))
    expect(vg.state.whosTurn).toEqual("player2");
    expect(vg.move(3))
    expect(vg.state.whosTurn).toEqual("player1");
  });

  it('should work for scenario 1', () => {
    doMoves(vg, [0, 6, 0, 6, 0, 6])
    expect(vg.bestMove()).toEqual(0);
    expect(vg.move(1))
    expect(vg.bestMove()).toEqual(6);
  });

  it('should work for scenario 2', () => {
    doMoves(vg, [3, 3, 4, 4])
    expect(vg.bestMove()).toEqual(2);
  });

  it('should work for scenario 3', () => {
    doMoves(vg, [0, 3, 0, 4, 3])
    expect( vg.bestMove()).toEqual(2);
  });

  it('should work for scenario 4', () => {
    vg.stateOfGame.maxLev = 6
    doMoves(vg, [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
    vg.dumpBoard();
    const bm = vg.bestMove()
    expect(bm ).toEqual(1);
  });

});
