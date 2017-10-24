import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuoteService, TradeMessage } from 'app/quote/quote.service';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/Rx';


@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.css']
})
export class QuoteComponent implements OnInit, OnDestroy {
  private _subscription: Subscription;

  lastTrades: TradeMessage[];

  constructor(private _quoteService: QuoteService) {

  }

  ngOnInit() {
    this.lastTrades = [];

    this._subscription = this._quoteService.getListener( ).subscribe(
      next => {
        if (this.lastTrades.length > 10) {
          this.lastTrades.splice(-1, 1);
        }
        this.lastTrades.splice(0, 0, next);
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
