import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { ITickerMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.css']
})
export class TickerComponent implements OnInit, OnChanges, OnDestroy {
  private _tickerSubscription: IChannelSubscription;

  tickerMessage: ITickerMessage;

  @Input( )
  symbol: string;

  symbolToDisplay: string;

  constructor(private _exchangeService: ExchangeService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TickerComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._tickerSubscription) {
        this._exchangeService.unsubscribe(this._tickerSubscription);
      }

      this.symbolToDisplay = changes.symbol.currentValue;

      console.log( 'TickerComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._tickerSubscription = this._exchangeService.getTicker( this.symbol );

      this._tickerSubscription.heartbeat.subscribe(
        hb => console.log( 'TickerComponent | Channel \'' + hb.channelName + '\' heartbeat @ ' + hb.timestamp )
      );

      this._tickerSubscription.listener.subscribe(
        next => {
          let tickerMessage: ITickerMessage = next as ITickerMessage;
          this.tickerMessage = tickerMessage;
        },
        error => console.log( 'TickerComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'TickerComponent | ngOnChanges | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._tickerSubscription) {
      this._exchangeService.unsubscribe(this._tickerSubscription);
    }
  }
}
