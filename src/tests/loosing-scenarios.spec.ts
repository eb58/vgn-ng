import { TestBed } from '@angular/core/testing';
import { ConnectFourModelService } from '../app/services/connect4-model.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('tests for loosing', () => {
  let vg: ConnectFourModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    vg = TestBed.inject(ConnectFourModelService);
  });

  test('scenario 1', () => {
    vg.gameSettings.whoBegins = 'ai'
    vg.doMoves([0, 3, 0, 4, 1, 5 ])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // C  _  _  _  _  _  _
    // C  C  _  H  H  H  _
    const m = vg.calcBestMoves()
    // console.log(m)
    expect(vg.state.whoseTurn==='ai')
    expect(m.every(x => x.score <= -vg.MAXVAL)).toBeTruthy(); // no chance to win!
  });

  test('scenario 2', () => {
    vg.doMoves([3, 3, 4, 0, 5])
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  _  _  _  _
    // _  _  _  C  _  _  _
    // C  _  _  H  H  H  _
    const m = vg.calcBestMoves()
    // console.log(m)
    expect(vg.state.whoseTurn==='ai')
    expect(m.every(x => x.score <= -vg.MAXVAL)).toBeTruthy(); // no chance to win!
  });

});
