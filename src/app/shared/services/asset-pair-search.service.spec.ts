/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AssetPairSearchService } from './asset-pair-search.service';

describe('Service: AssetPairSearch', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetPairSearchService]
    });
  });

  it('should ...', inject([AssetPairSearchService], (service: AssetPairSearchService) => {
    expect(service).toBeTruthy();
  }));
});