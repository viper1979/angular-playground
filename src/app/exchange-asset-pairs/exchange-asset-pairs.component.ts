import { Component, OnInit, Input } from '@angular/core';
import { AssetPairs } from 'app/exchange-overview/exchange-overview.component';
import { AssetPairSearchService } from 'app/shared/services/asset-pair-search.service';

@Component({
  selector: 'app-exchange-asset-pairs',
  templateUrl: './exchange-asset-pairs.component.html',
  styleUrls: ['./exchange-asset-pairs.component.css']
})
export class ExchangeAssetPairsComponent implements OnInit {
  @Input( )
  assetPairs: AssetPairs

  private _assetSearchFilter: string;

  visible: boolean;

  constructor(private _assetSearchService: AssetPairSearchService) { }

  ngOnInit() {
    this.visible = true;
    this._assetSearchFilter = '';
    this._assetSearchService.getListener( ).subscribe(
      next => {
        this._assetSearchFilter = next;
        this.applyFilter( );
      }
    );
  }

  private applyFilter( ): void {
    this.visible = !this.assetPairs.pairs.every( item => {
      return item.symbol.toLowerCase( ).indexOf( this._assetSearchFilter.toLowerCase( ) ) === -1
    });
  }

}
