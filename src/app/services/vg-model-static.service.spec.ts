import { TestBed } from '@angular/core/testing';

import { VgModelStaticService } from './vg-model-static.service';

describe('VgModelStaticService', () => {
  let service: VgModelStaticService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VgModelStaticService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
