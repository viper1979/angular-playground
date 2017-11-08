import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { TickerMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.css']
})
export class TickerComponent implements OnInit, OnChanges, OnDestroy {
  private _bitfinexSubscription: BitfinexChannelSubscription;

  tickerMessage: TickerMessage;

  @Input( )
  symbol: string;

  symbolToDisplay: string;

  constructor(private _bitfinexService: BitfinexService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TickerComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfinexSubscription) {
        this._bitfinexService.unsubscribe(this._bitfinexSubscription);
      }

      this.symbolToDisplay = changes.symbol.currentValue;

      console.log( 'TickerComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfinexSubscription = this._bitfinexService.getTickerListener( this.symbol );

      this._bitfinexSubscription.heartbeat.subscribe(
        hb => console.log( 'TickerComponent | Channel \'' + hb.channel + '\' heartbeat @ ' + hb.timestamp )
      );

      this._bitfinexSubscription.listener.subscribe(
        next => {
          let tickerMessage: TickerMessage = next as TickerMessage;
          this.tickerMessage = tickerMessage;
        },
        error => console.log( 'TickerComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'TickerComponent | ngOnChanges | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexSubscription);
    }
  }
}
