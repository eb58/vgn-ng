import { TestBed } from '@angular/core/testing';
import { ConnectFourModelStaticService } from '../app/services/model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VgModelStaticService', () => {
  let service: ConnectFourModelStaticService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    service = TestBed.inject(ConnectFourModelStaticService);
  });

  test('should be created', () => expect(service).toBeTruthy());
  test('should be initialized correctly', () => {
    expect(service.allWinningRows.length).toEqual(69)
    expect(service.winningRowsForFields.length).toEqual(42)
  })
});
