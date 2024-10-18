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

})