import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';
import { TradeMessage } from 'app/api/bitfenix/bitfenix-channel-messages';
import { BitfenixChannelSubscription } from 'app/api/bitfenix/bitfenix-channels';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/Rx';

@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.css']
})
export class QuoteComponent implements OnInit, OnChanges, OnDestroy {
  private _subscription: Subscription;
  private _bitfenixSubscription: BitfenixChannelSubscription;

  lastTrades: TradeMessage[];

  @Input( )
  symbol: string;

  constructor(private _quoteService: BitfenixService) {
  }

  ngOnInit() {
    this.lastTrades = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('QuoteComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfenixSubscription) {
        this._quoteService.unsubscribe( this._bitfenixSubscription );
      }

      console.log( 'QuoteComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfenixSubscription = this._quoteService.getTradeListener( this.symbol );
      this._bitfenixSubscription.listener.subscribe(
        next => {
          let tradeMessage: TradeMessage = next as TradeMessage;

          if (this.lastTrades.length > 20) {
            this.lastTrades.splice(-1, 1);
          }
          this.lastTrades.splice(0, 0, tradeMessage);
        },
        error => console.log( 'QuoteComponent | ngOnInit | error: ' + JSON.stringify(error) ),
        () => console.log( 'QuoteComponent | ngOnInit | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
