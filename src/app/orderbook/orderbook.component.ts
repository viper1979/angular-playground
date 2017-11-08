import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { BookMessage, OrderBookAction, TradeMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/Rx';

@Component({
  selector: 'app-orderbook',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.css']
})
export class OrderbookComponent implements OnInit, OnChanges, OnDestroy {
  private _bitfinexSubscription: BitfinexChannelSubscription;
  private _bitfinexTradeSubscription: BitfinexChannelSubscription;

  private _askBook: Map<number, BookMessage>;
  private _bidBook: Map<number, BookMessage>;

  askBook: BookMessage[];
  bidBook: BookMessage[];
  last: TradeMessage;

  @Input()
  symbol: string;

  @Input()
  orientation: string;

  constructor(private _bitfinexService: BitfinexService) {
  }

  ngOnInit() {
    this._askBook = new Map<number, BookMessage>( );
    this._bidBook = new Map<number, BookMessage>( );
    this.askBook = [];
    this.bidBook = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('OrderbookComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfinexSubscription) {
        this._bitfinexService.unsubscribe( this._bitfinexSubscription );
      }

      this._askBook = new Map<number, BookMessage>( );
      this._bidBook = new Map<number, BookMessage>( );
      this.askBook = [];
      this.bidBook = [];

      console.log( 'OrderbookComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfinexSubscription = this._bitfinexService.getBooksListener( this.symbol );
      this._bitfinexSubscription.listener.subscribe(
        next => {
          let bookMessage: BookMessage = next as BookMessage;

          // TODO: do something with the message
          // console.log( 'OrderbookComponent | ngOnChanges | bookMessage: ' + JSON.stringify( bookMessage ) );

          switch (bookMessage.action) {
            case OrderBookAction.UpdateAsk: {
              this._askBook.set(bookMessage.price, bookMessage);
              // this.askBook = Array.from(this._askBook.values()).sort( (ask1, ask2) => this.bookMessageComparer(ask1, ask2) );
              let tmpArray = Array.from(this._askBook.values()).sort( (ask1, ask2) => this.bookMessageComparer(ask1, ask2) );

              tmpArray.forEach( (item, index) => {
                if (index > 0) {
                  item.levelAmount = tmpArray[ index - 1 ].levelAmount + item.amount;
                } else {
                  item.levelAmount = item.amount;
                }
              });

              if (this.orientation === 'horizontal') {
                this.askBook = tmpArray;
              } else {
                this.askBook = tmpArray.slice( 0, 12 ).reverse( );
              }
              return;
            }
            case OrderBookAction.UpdateBid: {
              this._bidBook.set(bookMessage.price, bookMessage);
              let tmpArray = Array.from(this._bidBook.values()).sort( (bid1, bid2) => this.bookMessageComparer(bid1, bid2) );

              if (this.orientation === 'horizontal') {
                this.bidBook = tmpArray;
              } else {
                this.bidBook = tmpArray.slice( tmpArray.length - 12 ).reverse( );
              }

              let previousValue: number = 0;
              this.bidBook.forEach( item => {
                item.levelAmount = previousValue + item.amount;
                previousValue += item.amount;
              });

              return;
            }
            case OrderBookAction.DeleteAsk: {
              if (this._askBook.has(bookMessage.price)) {
                this._askBook.delete(bookMessage.price);
                let tmpArray = Array.from(this._askBook.values()).sort( (ask1, ask2) => this.bookMessageComparer(ask1, ask2) );

                tmpArray.forEach( (item, index) => {
                  if (index > 0) {
                    item.levelAmount = tmpArray[ index - 1 ].levelAmount + item.amount;
                  } else {
                    item.levelAmount = item.amount;
                  }
                });

                if (this.orientation === 'horizontal') {
                  this.askBook = tmpArray;
                } else {
                  this.askBook = tmpArray.slice( 0, 12 ).reverse( );
                }
              }
              return;
            }
            case OrderBookAction.DeleteBid: {
              if (this._bidBook.has(bookMessage.price)) {
                this._bidBook.delete(bookMessage.price);
                let tmpArray = Array.from(this._bidBook.values()).sort( (bid1, bid2) => this.bookMessageComparer(bid1, bid2) );

                if (this.orientation === 'horizontal') {
                  this.bidBook = tmpArray;
                } else {
                  this.bidBook = tmpArray.slice( tmpArray.length - 12 ).reverse( );
                }

                let previousValue: number = 0;
                this.bidBook.forEach( item => {
                  item.levelAmount = previousValue + item.amount;
                  previousValue += item.amount;
                });
              }
              return;
            }
            default: {
              console.log( 'Unknown order book action' );
            }
          }
        },
        error => console.log( 'OrderbookComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'OrderbookComponent | ngOnChanges | completed' )
      );

      this._bitfinexTradeSubscription = this._bitfinexService.getTradeListener( this.symbol );
      this._bitfinexTradeSubscription.listener.subscribe(
        next => {
          this.last = next as TradeMessage;
        }
      )
    }
  }

  private bookMessageComparer( bm1: BookMessage, bm2: BookMessage ): number {
    if (bm1.price > bm2.price) {
      return 1;
    }
    if (bm2.price > bm1.price) {
      return -1;
    }
    return 0;
  }

  ngOnDestroy() {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexSubscription);
    }
  }
}
