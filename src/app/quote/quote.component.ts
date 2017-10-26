import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class QuoteComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _bitfenixSubscription: BitfenixChannelSubscription;

  lastTrades: TradeMessage[];

  constructor(private _quoteService: BitfenixService) {

  }

  ngOnInit() {
    this.lastTrades = [];

    this._bitfenixSubscription = this._quoteService.getTradeListener( 'BTC', 'USD' );
    this._bitfenixSubscription.listener.subscribe(
      next => {
        let tradeMessage: TradeMessage = next as TradeMessage;

        if (this.lastTrades.length > 10) {
          this.lastTrades.splice(-1, 1);
        }
        this.lastTrades.splice(0, 0, tradeMessage);
      },
      error => console.log( 'QuoteComponent | ngOnInit | error: ' + JSON.stringify(error) ),
      () => console.log( 'QuoteComponent | ngOnInit | completed' )
    );
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
