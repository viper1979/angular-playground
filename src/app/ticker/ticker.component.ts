import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';
import { BitfenixChannelSubscription } from 'app/api/bitfenix/bitfenix-channels';
import { TickerMessage } from 'app/api/bitfenix/bitfenix-channel-messages';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-ticker',
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.css']
})
export class TickerComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;
  private _bitfenixSubscription: BitfenixChannelSubscription;

  tickerMessage: TickerMessage;

  @Input( )
  fromCurrency: string;

  @Input( )
  toCurrency: string;

  constructor(private _tickerService: BitfenixService) { }

  ngOnInit() {
    this._bitfenixSubscription = this._tickerService.getTickerListener( this.fromCurrency.toUpperCase( ), this.toCurrency.toUpperCase( ) );
    this._bitfenixSubscription.listener.subscribe(
      next => {
        let tickerMessage: TickerMessage = next as TickerMessage;
        this.tickerMessage = tickerMessage;
      },
      error => console.log( 'TickerComponent | ngOnInit | error: ' + JSON.stringify(error) ),
      () => console.log( 'TickerComponent | ngOnInit | completed' )
    );
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
