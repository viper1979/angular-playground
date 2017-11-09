import { Component, OnInit, Input } from '@angular/core';
import { AssetPairs } from 'app/exchange-overview/exchange-overview.component';

@Component({
  selector: 'app-exchange-asset-pairs',
  templateUrl: './exchange-asset-pairs.component.html',
  styleUrls: ['./exchange-asset-pairs.component.css']
})
export class ExchangeAssetPairsComponent implements OnInit {
  @Input( )
  assetPairs: AssetPairs

  constructor() { }

  ngOnInit() {
  }

}
