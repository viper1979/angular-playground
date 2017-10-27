import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';
import { BitfenixChannelSubscription } from 'app/api/bitfenix/bitfenix-channels';
import { TickerMessage } from 'app/api/bitfenix/bitfenix-channel-messages';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.css']
})
export class TickerComponent implements OnInit, OnChanges, OnDestroy {
  private _subscription: Subscription;
  private _bitfenixSubscription: BitfenixChannelSubscription;

  tickerMessage: TickerMessage;

  @Input( )
  symbol: string;

  constructor(private _tickerService: BitfenixService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TickerComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfenixSubscription) {
        this._tickerService.unsubscribe(this._bitfenixSubscription);
      }

      console.log( 'TickerComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfenixSubscription = this._tickerService.getTickerListener( this.symbol );
      this._bitfenixSubscription.listener.subscribe(
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
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
