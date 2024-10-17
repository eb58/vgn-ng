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
    vg.dumpBoard(vg.state.board, 'scenario1');
    expect(vg.calcBestMoves()[0].move).toEqual(6);
  });

  test('scenario 2', () => {
    vg.doMoves([3, 3, 4])
    const bm = vg.calcBestMoves()[0].move
    vg.dumpBoard(vg.state.board, 'scenario2');
    expect(bm === 2 || bm === 5).toBeTruthy();
  });

  test('scenario 3', () => {
    vg.doMoves([0, 3, 0, 4, 3])
    vg.dumpBoard(vg.state.board, 'scenario3');
    const bm = vg.calcBestMoves()[0].move
    expect(bm === 2 || bm === 5).toBeTruthy();
  });

  test('scenario 4', () => {
    // vg.gameSettings.maxLev = 6
    vg.doMoves([3, 3, 3, 3, 3, 2, 3, 4, 0, 2, 0, 2, 2, 4, 4, 0, 4, 4, 4, 5, 5, 5, 5, 6, 5, 1, 1])
    vg.dumpBoard(vg.state.board, 'scenario4');
    const bm = vg.calcBestMoves()[0]
    expect(bm.move).toEqual(5);
  });

  test('scenario 5 - remis', () => {
    //vg.gameSettings.maxLev = 6
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 4])
    vg.dumpBoard(vg.state.board, 'scenario 5');
    const bm = vg.calcBestMoves()[0].move
    expect(bm === 4 || bm === 1).toBeTruthy();
  });

  test('scenario 6 - volles Spielfeld', () => {
    vg.dumpBoard(vg.state.board, 'scenario 6');
    vg.doMoves([3, 2, 3, 3, 3, 6, 3, 6, 3, 6, 6, 2, 1, 2, 2, 2, 2, 6, 6, 5, 5, 5, 5, 4, 5, 5, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 4, 4, 1, 4])
    vg.dumpBoard(vg.state.board, 'scenario 6');
    expect(vg.state.moves.length).toBe(40)

    const bm = vg.calcBestMoves()[0].move
    expect(bm === 1 || bm === 4).toBeTruthy()
  });


});
