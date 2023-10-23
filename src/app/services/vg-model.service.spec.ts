import { TestBed } from '@angular/core/testing';

import { VgModelService } from './vg-model.service';

describe('VgModelService', () => {
  let service: VgModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VgModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
