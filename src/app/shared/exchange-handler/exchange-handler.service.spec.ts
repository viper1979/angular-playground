/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ExchangeHandlerService } from './exchange-handler.service';

describe('Service: ExchangeHandler', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExchangeHandlerService]
    });
  });

  it('should ...', inject([ExchangeHandlerService], (service: ExchangeHandlerService) => {
    expect(service).toBeTruthy();
  }));
});