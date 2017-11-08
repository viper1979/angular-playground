import { Component, OnInit, OnDestroy } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TickerMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { ArrayHelper } from 'app/shared/helper/array-helper';

@Component({
  selector: 'app-exchange-overview',
  templateUrl: './exchange-overview.component.html',
  styleUrls: ['./exchange-overview.component.css']
})
export class ExchangeOverviewComponent implements OnInit, OnDestroy {
  private _assetPairs: Map<string, AssetPair>;
  private _sortedAssetPairs: Map<string, AssetPair[]>;
  primaryAssets: string[];

  constructor(private _bitfinexService: BitfinexService) {
    this._assetPairs = new Map<string, AssetPair>( );
    this._sortedAssetPairs = new Map<string, AssetPair[]>( );
    this.primaryAssets = [];
  }

  ngOnInit() {
    this.initAssetPairs( );
  }

  ngOnDestroy() {
  }

  private initAssetPairs( ): void {
    let availableSymbols = this._bitfinexService.getAvailableSymbols( );

    availableSymbols.forEach( symbol => {
      let primaryCurrency = symbol.substring( 0, 3 );

      if (ArrayHelper.contains( this.primaryAssets, primaryCurrency ) === false) {
        this.primaryAssets.push( primaryCurrency );
      }
    });

    this.primaryAssets.forEach( item => console.log( item ) );

    // subscribe to each available symbol
    for (let i = 0; i < availableSymbols.length; i++) {
      let symbol = availableSymbols[ i ];

      let assetPair = new AssetPair( );
      assetPair.exchange = 'Bitfinex';
      assetPair.symbol = symbol;

      this._assetPairs.set( symbol, assetPair );
    }
  }

  getAssetPairs( primaryCurrency: string ): AssetPair[] {
    // check if we already have the sorted array in cache
    if (this._sortedAssetPairs.has(primaryCurrency)) {
      return this._sortedAssetPairs.get(primaryCurrency);
    }

    // get all symbols which starts with the given currency-key
    let matchingSymbols = Array.from( this._assetPairs.keys( ) ).filter( item => item.substring( 0, 3 ) === primaryCurrency );
    let matchingAssetPairs: AssetPair[] = [];

    // get all assetPairs for the matching symbols
    matchingSymbols.forEach( item => {
      matchingAssetPairs.push( this._assetPairs.get( item ) );
    });

    // when every assetPair already has a 'volume' than sort all pairs by their volume and store them in a cache
    if (matchingAssetPairs.every(pair => pair.tickerMessage && pair.tickerMessage.volume > 0)) {
      this._sortedAssetPairs.set( primaryCurrency, matchingAssetPairs.sort((a, b) => a.tickerMessage.volume > b.tickerMessage.volume ? -1 : 1) );
      matchingAssetPairs = this._sortedAssetPairs.get( primaryCurrency );
    }

    return matchingAssetPairs;
  }
}

export class AssetPairs {
  primaryCurrency: string;
  pairs: AssetPair[];

  constructor( ) {
    this.pairs = [];
  }
}

export class AssetPair {
  exchange: string;
  symbol: string;
  tickerMessage: TickerMessage;

  constructor( ) { }
}

