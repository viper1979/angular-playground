/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BitfinexService } from './bitfinex.service';

describe('Service: Quote', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BitfinexService]
    });
  });

  it('should ...', inject([BitfinexService], (service: BitfinexService) => {
    expect(service).toBeTruthy();
  }));
});
