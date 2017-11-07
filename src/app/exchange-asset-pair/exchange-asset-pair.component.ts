import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { AssetPair } from 'app/exchange-overview/exchange-overview.component';

@Component({
  selector: 'app-exchange-asset-pair',
  templateUrl: './exchange-asset-pair.component.html',
  styleUrls: ['./exchange-asset-pair.component.css']
})
export class ExchangeAssetPairComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  assetPair: AssetPair;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngOnDestroy() {
  }
}
