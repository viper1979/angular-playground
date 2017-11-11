import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { OrderBookAction, IOrderbookMessage, ITradeMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';
import 'rxjs/Rx';

@Component({
  selector: 'app-orderbook',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.css']
})
export class OrderbookComponent implements OnInit, OnChanges, OnDestroy {
  private _orderbookSubscription: IChannelSubscription;
  private _tradeSubscription: IChannelSubscription;

  private _askBook: Map<number, IOrderbookMessage>;
  private _bidBook: Map<number, IOrderbookMessage>;

  askBook: IOrderbookMessage[];
  bidBook: IOrderbookMessage[];
  last: ITradeMessage;

  @Input()
  symbol: string;

  @Input()
  orientation: string;

  constructor(private _exchangeService: ExchangeService) {
  }

  ngOnInit() {
    this._askBook = new Map<number, IOrderbookMessage>( );
    this._bidBook = new Map<number, IOrderbookMessage>( );
    this.askBook = [];
    this.bidBook = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('OrderbookComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );

    if (changes.symbol.currentValue.length === 6) {
      if (this._orderbookSubscription) {
        this._exchangeService.unsubscribe( this._orderbookSubscription );
      }

      this._askBook = new Map<number, IOrderbookMessage>( );
      this._bidBook = new Map<number, IOrderbookMessage>( );
      this.askBook = [];
      this.bidBook = [];

      console.log( 'OrderbookComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._orderbookSubscription = this._exchangeService.getOrderBooks( this.symbol );
      this._orderbookSubscription.listener.subscribe(
        next => {
          let bookMessage: IOrderbookMessage = next as IOrderbookMessage;

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

      this._tradeSubscription = this._exchangeService.getTrades( this.symbol );
      this._tradeSubscription.listener.subscribe(
        next => {
          this.last = next as ITradeMessage;
        }
      )
    }
  }

  private bookMessageComparer( bm1: IOrderbookMessage, bm2: IOrderbookMessage ): number {
    if (bm1.price > bm2.price) {
      return 1;
    }
    if (bm2.price > bm1.price) {
      return -1;
    }
    return 0;
  }

  ngOnDestroy() {
    if (this._orderbookSubscription) {
      this._exchangeService.unsubscribe(this._orderbookSubscription);
    }
  }
}
