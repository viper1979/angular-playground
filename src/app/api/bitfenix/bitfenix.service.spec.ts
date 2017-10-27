/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BitfenixService } from './bitfenix.service';

describe('Service: Quote', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BitfenixService]
    });
  });

  it('should ...', inject([BitfenixService], (service: BitfenixService) => {
    expect(service).toBeTruthy();
  }));
});
