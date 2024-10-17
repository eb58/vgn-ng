import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { range, DIM } from '../app/services/connect4-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ConnectFourModelService', () => {
  let vg: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    vg = TestBed.inject(ConnectFourModelService);
  });

  test('should be created', () => expect(vg).toBeTruthy());

  test('should be initalized correctly', () => {
    expect(vg.state.board.length).toBe(DIM.NCOL * DIM.NROW);
    expect(vg.state.board).toEqual(range(DIM.NCOL * DIM.NROW).map(() => 0));
    expect(vg.state.moves).toEqual([]);
    expect(vg.state.whoseTurn).toEqual("human");
    expect(vg.state.heightCols).toEqual(range(vg.origState.heightCols.length).map(() => 0));
    expect(vg.isMill()).toBe(false);
    expect(vg.isDraw()).toBe(false);
  });

  test('whoseTurn works', () => {
    expect(vg.state.whoseTurn).toEqual("human");
    expect(vg.move(0))
    expect(vg.state.whoseTurn).toEqual("ai");
    expect(vg.move(3))
    expect(vg.state.whoseTurn).toEqual("human");
  });

  test('full board', () => {
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4, 1, 4])
    expect(vg.state.moves.length).toBe(DIM.NCOL * DIM.NROW)
    expect(vg.calcBestMoves().length).toBe(0)
  });

  test('scenario 1', () => {
    vg.doMoves([0, 6, 0, 6, 0, 6, 1])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  _  _  _  C
    // H  _  _  _  _  _  C
    // H  H  _  _  _  _  C
    const m = vg.calcBestMoves()
    expect(m[0].move).toEqual(6);
  });

  test('scenario 2', () => {
    vg.doMoves([3, 3, 4])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // _  _  _  H  H  _  _
    const m = vg.calcBestMoves()
    console.log(m)
    expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
  });

  test('scenario 3', () => {
    vg.doMoves([3, 3, 4, 3, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // _  _  _  C  _  _  _
    // _  _  _  H  H  H  _
    const m = vg.calcBestMoves()
    console.log(m)
    expect(m[0].score <= vg.MAXVAL).toBeTruthy();
  });

  test('scenario 4', () => {
    vg.doMoves([0, 3, 0, 4, 3])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // H  _  _  H  _  _  _
    // H  _  _  C  C  _  _
    const m = vg.calcBestMoves()
    console.log(m)
    expect(m[0].move === 2 || m[0].move === 5).toBeTruthy();
  });

  test('scenario 5', () => {
    vg.doMoves([3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
    // _  _  _  H  H  _  _                                                                 
    // _  _  _  H  C  H  _                                                                 
    // _  _  H  C  H  H  _                                                                 
    // C  _  C  H  H  C  _                                                                 
    // H  H  C  C  C  H  _
    // H  C  C  H  C  C  C
    const m = vg.calcBestMoves()
    console.log(m)
    expect(m[0].move).toEqual(5);
    expect(m[0].score).toEqual(vg.MAXVAL);
  });

  test('scenario 6 - remis', () => {
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 4])
    // C  _  H  H  _  C  H                                                                 
    // H  H  C  H  C  H  C                                                                 
    // C  H  H  H  C  H  H                                                                 
    // H  C  C  C  H  C  C                                                                 
    // C  H  C  H  C  H  C
    // H  H  C  H  C  C  C
    const bm = vg.calcBestMoves()[0].move
    expect(bm === 1 || bm === 4).toBeTruthy();
  });

  test('scenario 7 - board almost full', () => {
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4])
    // C  _  H  H  _  C  H                                                                 
    // H  H  C  H  C  H  C                                                                 
    // C  H  H  H  C  H  H                                                                 
    // H  C  C  C  H  C  C                                                                 
    // C  H  C  H  C  H  C
    // H  H  C  H  C  C  C
    expect(vg.state.moves.length).toBe(40)
    const m = vg.calcBestMoves()
    console.log(m)
    expect(m[0].move === 1 || m[0].move === 4).toBeTruthy()
  });


});
