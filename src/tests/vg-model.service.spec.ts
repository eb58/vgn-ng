import { TestBed } from '@angular/core/testing';

import { VgModelService } from '../app/services/vg-model.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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
    expect(vg.stateOfGame.whoBegins).toEqual("human");
  });

  it('should work correctly', () => {
    expect(vg.move(0))
    expect(vg.state.whoseTurn).toEqual("computer");
    expect(vg.move(3))
    expect(vg.state.whoseTurn).toEqual("human");
  });

  it('should work for scenario 1', () => {
   vg.doMoves( [0, 6, 0, 6, 0, 6])
    expect(vg.calcBestMove().move).toEqual(0);
    expect(vg.move(1))
    expect(vg.calcBestMove().move).toEqual(6);
  });

  it('should work for scenario 2', () => {
    vg.doMoves( [3, 3, 4, 4])
    expect(vg.calcBestMove().move).toEqual(2);
  });

  it('should work for scenario 3', () => {
    vg.doMoves( [0, 3, 0, 4, 3])
    expect( vg.calcBestMove().move).toEqual(2);
  });

  it('should work for scenario 4', () => {
    vg.stateOfGame.maxLev = 6
    vg.doMoves( [3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
    vg.dumpBoard();
    const bm = vg.calcBestMove()
    expect(bm.move).toEqual(5);
  });

  it('should work for scenario 5 - remis', () => {
    vg.stateOfGame.maxLev = 6
    vg.doMoves( [3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 4])
    vg.dumpBoard();
    const bm = vg.calcBestMove().move
    expect(bm===4 || bm ===1 ).toBeTrue();
  });

  it('should work for scenario 6 - volles Spielfeld', () => {
    vg.stateOfGame.maxLev = 6
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4])
    vg.dumpBoard();
    const bm = vg.calcBestMove().move
    expect(bm===1 || bm=== 4).toBeTrue()
  });

});
