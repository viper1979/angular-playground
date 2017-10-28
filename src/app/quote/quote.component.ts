import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TradeMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/Rx';

@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.css']
})
export class QuoteComponent implements OnInit, OnChanges, OnDestroy {
  private _subscription: Subscription;
  private _bitfinexSubscription: BitfinexChannelSubscription;

  lastTrades: TradeMessage[];

  @Input( )
  symbol: string;

  constructor(private _quoteService: BitfinexService) {
  }

  ngOnInit() {
    this.lastTrades = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('QuoteComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfinexSubscription) {
        this._quoteService.unsubscribe( this._bitfinexSubscription );
      }

      console.log( 'QuoteComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfinexSubscription = this._quoteService.getTradeListener( this.symbol );

      this._bitfinexSubscription.heartbeat.subscribe(
        hb => console.log( 'QuoteComponent | Channel \'' + hb.channel + '\' heartbeat @ ' + hb.timestamp )
      );

      this._bitfinexSubscription.listener.subscribe(
        next => {
          let tradeMessage: TradeMessage = next as TradeMessage;

          if (this.lastTrades.length > 24) {
            this.lastTrades.splice(-1, 1);
          }
          this.lastTrades.splice(0, 0, tradeMessage);
        },
        error => console.log( 'QuoteComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'QuoteComponent | ngOnChanges | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
