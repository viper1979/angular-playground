import { Component, OnInit, OnDestroy } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TickerMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';

@Component({
  selector: 'app-exchange-overview',
  templateUrl: './exchange-overview.component.html',
  styleUrls: ['./exchange-overview.component.css']
})
export class ExchangeOverviewComponent implements OnInit, OnDestroy {
  private _tickerSubscriptions: Map<string, BitfinexChannelSubscription>;
  // assetPairs: Map<string, AssetPair>;
  assetPairs: AssetPair[];


  constructor(private _bitfinexService: BitfinexService) {
    this._tickerSubscriptions = new Map<string, BitfinexChannelSubscription>( );
    // this.assetPairs = new Map<string, AssetPair>( );
    this.assetPairs = [];
  }

  ngOnInit() {
    this.subscribeAllSymbols( );
  }

  ngOnDestroy() {
    if (this._tickerSubscriptions && this._tickerSubscriptions.size > 0) {
      this._tickerSubscriptions.forEach( item => {
        this._bitfinexService.unsubscribe( item );
      });
    }
  }

  private subscribeAllSymbols( ): void {
    let availableSymbols = this._bitfinexService.getAvailableSymbols( );

    let grpByStartingCurrency = this.groupByArray( availableSymbols, (item: string) => {
      return item.substring( 0, 3 );
    } );

    grpByStartingCurrency.forEach( item => {
      console.log( item.key );
    });

    return;

    // subscribe to each available symbol
    // for (let i = 0; i < availableSymbols.length; i++) {
    //   let symbol = availableSymbols[ i ];
    //   let subscribtion = this._bitfinexService.getTickerListener( symbol );


    //   subscribtion.listener.subscribe(
    //     next => {
    //       let tickerMessage: TickerMessage = next as TickerMessage;

    //       let assetPair = new AssetPair( );
    //       assetPair.symbol = symbol;
    //       assetPair.tickerMessage = tickerMessage;

    //       let index = this.assetPairs.findIndex( item => item.symbol === symbol );
    //       if (index >= 0) {
    //         this.assetPairs[ index ] = assetPair;
    //       } else {
    //         this.assetPairs.push( assetPair );
    //       }
    //     },
    //     error => console.log( 'error'),
    //     () => console.log( 'complete' )
    //   );

    //   this._tickerSubscriptions.set( symbol, subscribtion );
    // }
  }

  groupByArray(xs, key) {
    return xs.reduce( function (rv, x) {
      let v = key instanceof Function ? key(x) : x[key];
      let el = rv.find((r) => r && r.key === v);
      if (el) {
        el.values.push(x);
      } else {
        rv.push({ key: v, values: [x] });
      }
      return rv;
    }, []);
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
  symbol: string;
  tickerMessage: TickerMessage;

  constructor( ) { }
}

