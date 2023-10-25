import { TestBed } from '@angular/core/testing';

import { VgModelService } from './vg-model.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VgModelService', () => {
  let service: VgModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas:[CUSTOM_ELEMENTS_SCHEMA]});
    service = TestBed.inject(VgModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be initialized correctly', () => {
    expect(service.NCOL).toEqual(7);
    expect(service.stateOfGame.maxLev).toEqual(4);
    expect(service.stateOfGame.whoBegins).toEqual("player1");
  });

  it('should work correctly', () => {
    expect(service.move(0))
    expect(service.state.whosTurn).toEqual("player2");
    expect(service.move(3))
    expect(service.state.whosTurn).toEqual("player1");
  });
});
