import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TradeMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import 'rxjs/Rx';

@Component({
  selector: 'app-trades',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.css']
})
export class TradesComponent implements OnInit, OnChanges, OnDestroy {
  private _bitfinexSubscription: BitfinexChannelSubscription;

  lastTrades: TradeMessage[];

  @Input( )
  symbol: string;

  constructor(private _bitfinexService: BitfinexService) {
  }

  ngOnInit() {
    this.lastTrades = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TradesComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfinexSubscription) {
        this._bitfinexService.unsubscribe( this._bitfinexSubscription );
      }

      console.log( 'TradesComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfinexSubscription = this._bitfinexService.getTradeListener( this.symbol );

      this._bitfinexSubscription.heartbeat.subscribe(
        hb => console.log( 'TradesComponent | Channel \'' + hb.channel + '\' heartbeat @ ' + hb.timestamp )
      );

      this._bitfinexSubscription.listener.subscribe(
        next => {
          let tradeMessage: TradeMessage = next as TradeMessage;

          if (this.lastTrades.length > 24) {
            this.lastTrades.splice(-1, 1);
          }
          this.lastTrades.splice(0, 0, tradeMessage);
        },
        error => console.log( 'TradesComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'TradesComponent | ngOnChanges | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexSubscription);
    }
  }
}
