import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { ITickerMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';
import { ArrayHelper } from 'app/shared/helper/array-helper';
import { IAssetPair } from 'app/shared/exchange-handler/interfaces/asset-pair';

@Component({
  selector: 'app-exchange-overview',
  templateUrl: './exchange-overview.component.html',
  styleUrls: ['./exchange-overview.component.css']
})
export class ExchangeOverviewComponent implements OnInit, OnDestroy {
  private _assetPairs: Map<string, IAssetPair>;
  private _sortedAssetPairs: Map<string, AssetPairs>;
  primaryAssets: string[];

  constructor(private _exchangeService: ExchangeService) {
    this._assetPairs = new Map<string, IAssetPair>( );
    this._sortedAssetPairs = new Map<string, AssetPairs>( );
    this.primaryAssets = [];
  }

  ngOnInit() {
    this.initAssetPairs( );
  }

  ngOnDestroy() {
  }

  private initAssetPairs( ): void {
    this._exchangeService.getAvailableSymbols( ).subscribe(
      availableSymbols => {
        availableSymbols.forEach( assetPair => {
          let primaryCurrency = assetPair.fromCurrency;

          if (ArrayHelper.contains( this.primaryAssets, primaryCurrency ) === false) {
            this.primaryAssets.push( primaryCurrency );
          }
        });

        /* DEBUG DEBUG DEBUG */
        // this.primaryAssets = [];
        // this.primaryAssets.push( 'BTC' );
        /*********************/

        // subscribe to each available symbol
        for (let i = 0; i < availableSymbols.length; i++) {
          let assetPair = availableSymbols[ i ];
          this._assetPairs.set( assetPair.displaySymbol, assetPair );
        }
      }
    );
  }

  getAssetPairs( primaryCurrency: string ): AssetPairs {
    // check if we already have the sorted array in cache
    if (this._sortedAssetPairs.has(primaryCurrency)) {
      return this._sortedAssetPairs.get(primaryCurrency);
    }

    if (!this._assetPairs) {
      return new AssetPairs( );
    }

    // get all symbols which starts with the given currency-key
    let matchingSymbols = Array.from( this._assetPairs.keys( ) ).filter( item => item.substring( 0, 3 ) === primaryCurrency );
    let matchingAssetPairs = new AssetPairs( );

    // get all assetPairs for the matching symbols
    matchingSymbols.forEach( item => {
      matchingAssetPairs.pairs.push( this._assetPairs.get( item ) );
    });

    // when every assetPair already has a 'volume' than sort all pairs by their volume and store them in a cache
    if (matchingAssetPairs.pairs.every(pair => pair.tickerMessage !== undefined && pair.tickerMessage !== null)) {
      matchingAssetPairs.pairs = matchingAssetPairs.pairs.sort((a, b) => a.tickerMessage.volume > b.tickerMessage.volume ? -1 : 1);
      matchingAssetPairs.finalSorting = true;
      this._sortedAssetPairs.set( primaryCurrency, matchingAssetPairs );

      console.log( 'final sorting reached for primary-currency: ' + primaryCurrency);
    }

    return matchingAssetPairs;
  }
}

export class AssetPairs {
  primaryCurrency: string;
  pairs: IAssetPair[];
  finalSorting: boolean;

  constructor( ) {
    this.pairs = [];
    this.finalSorting = false;
  }
}
