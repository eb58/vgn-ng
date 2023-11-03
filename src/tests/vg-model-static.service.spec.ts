import { TestBed } from '@angular/core/testing';

import { VgModelStaticService } from '../app/services/vg-model-static.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VgModelStaticService', () => {
  let service: VgModelStaticService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas:[CUSTOM_ELEMENTS_SCHEMA]});
    service = TestBed.inject(VgModelStaticService);
  });

  it('should be created', () => expect(service).toBeTruthy());
  it('should be initialized correctly', () => {
    service.initGRs()
    expect(service.gr.length).toEqual(69)
    expect(service.grs.length).toEqual(42)
  })
});
