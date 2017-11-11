import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { ITradeMessage, OrderType, ITradeSnapshotMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';
import 'rxjs/Rx';

@Component({
  selector: 'app-trades',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.css']
})
export class TradesComponent implements OnInit, OnChanges, OnDestroy {
  private _tradeSubscription: IChannelSubscription;
  orderType = OrderType;

  lastTrades: ITradeMessage[];

  @Input( )
  symbol: string;

  constructor(private _exchangeService: ExchangeService) {
  }

  ngOnInit() {
    this.lastTrades = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TradesComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._tradeSubscription) {
        this._exchangeService.unsubscribe( this._tradeSubscription );
      }

      console.log( 'TradesComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._tradeSubscription = this._exchangeService.getTrades( this.symbol );

      this._tradeSubscription.heartbeat.subscribe(
        hb => console.log( 'TradesComponent | Channel \'' + hb.channelName + '\' heartbeat @ ' + hb.timestamp )
      );

      this._tradeSubscription.listener.subscribe(
        next => {
          let tradeMessage: ITradeMessage | ITradeSnapshotMessage;

          if (next.isSnapshot) {
            tradeMessage = next as ITradeSnapshotMessage;
            this.lastTrades = tradeMessage.messages.sort( (t1, t2) => t2.timestamp.getTime( ) - t1.timestamp.getTime( ) ).slice( 0, 24 );
            return;
          }

          tradeMessage = next as ITradeMessage;

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
    if (this._tradeSubscription) {
      this._exchangeService.unsubscribe(this._tradeSubscription);
    }
  }
}
