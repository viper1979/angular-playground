/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { GdaxService } from './gdax.service';

describe('Service: Gdax', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GdaxService]
    });
  });

  it('should ...', inject([GdaxService], (service: GdaxService) => {
    expect(service).toBeTruthy();
  }));
});