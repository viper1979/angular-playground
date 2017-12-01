import { EventEmitter } from '@angular/core';
import { IChannel } from 'app/shared/exchange-handler/interfaces/channels';
import { IChannelMessage, OrderType } from 'app/shared/exchange-handler/interfaces/channel-messages';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { GdaxTickerMessage, GdaxChannelMessage, GdaxTickerSnapshotMessage, GdaxCandleSnapshotMessage, GdaxCandleMessage, GdaxTradeMessage, GdaxTradeSnapshotMessage } from 'app/api/gdax/gdax-channel-messages';
import { tick } from '@angular/core/testing';
import { RequestItem } from 'app/shared/api-request-queue/api-request-queue';
import { element } from 'protractor';

export class GdaxChannelSubscription implements IChannelSubscription {
  protected readonly _channel: IChannel;
  public heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;

  get channelIdentifier(): number {
    return -1;
  }
  get channelName(): string {
    return '<no_channel>';
  }

  public readonly symbol: string;
  public readonly listener: Observable<IChannelMessage>;

  constructor( channel: IChannel, pair: string, listener: Observable<IChannelMessage> ) {
    this._channel = channel;
    this.symbol = pair;
    this.listener = listener;

    this.heartbeat = new EventEmitter<{channelName: string, timestamp: Date}>( );
    this._channel.heartbeat.subscribe( event => {
      this.heartbeat.emit( event );
    })
  }
}

export abstract class GdaxChannel implements IChannel {
  public channelIdentifier: any;
  public channelName: string;
  public heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;
  protected subscription: IChannelSubscription;
  public isSubscribed: boolean;

  abstract getSubscribeMessage( options?: any ): string;
  abstract getSubscription( ): IChannelSubscription;
  abstract sendMessage( parsedMessage: any ): void;

  public sendHeartbeat( ): void {
    this.heartbeat.emit({ channelName: this.channelName, timestamp: new Date() });
  }

  abstract getUnsubscribeMessage( ): string;

  constructor( ) {
    this.heartbeat = new EventEmitter<{channelName: string, timestamp: Date}>( );
    this.isSubscribed = false;
  }
}

export class GdaxTickerChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  protected listener: BehaviorSubject<IChannelMessage>;
  public isSubscribed: boolean;

  public apiTicker: RequestItem;
  public apiStats: RequestItem;

  constructor( ) {
    super();

    this.listener = new BehaviorSubject<IChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    console.log( 'GdaxTickerChannel | getSubscribeMessage ');

    return JSON.stringify({
      'type': 'subscribe',
      'product_ids': [
        this.pair
      ],
      'channels': [
        'ticker'
      ]
    });
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'type': 'unsubscribe',
      'product_ids': [
        this.pair
      ],
      'channels': [
        'ticker'
      ]
    });
  }

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );

    if (this.apiStats && this.apiTicker) {
      let combinedObservable = this.combineApiRequests( );
      combinedObservable.subscribe(
        response => {
          let combinedApiRequestMessage = {
            source: 'REST_API',
            data: response as GdaxTickerMessage
          };

          this.sendMessage( combinedApiRequestMessage );
        }
      );
    }

    return new GdaxChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage.source === 'REST_API') {
        this.listener.next( parsedMessage.data );
     } else {
        let tickerMessage = new GdaxTickerMessage( );
        tickerMessage.channelIdentifier = parsedMessage.type + '_' + parsedMessage.product_id;
        tickerMessage.messageType = 'ticker';
        tickerMessage.isSnapshot = false;
        tickerMessage.source = parsedMessage;

        tickerMessage.lastPrice = parsedMessage.price;
        tickerMessage.high = parsedMessage.high_24h;
        tickerMessage.low = parsedMessage.low_24h;
        tickerMessage.ask = parsedMessage.best_ask;
        tickerMessage.bid = parsedMessage.best_bid;
        tickerMessage.volume = parsedMessage.volume_24h;
        tickerMessage.dailyChange = ( tickerMessage.lastPrice - parsedMessage.open_24h );
        tickerMessage.dailyChangePercent = ( ( tickerMessage.lastPrice - parsedMessage.open_24h ) / parsedMessage.open_24h ) * 100;

        this.listener.next( tickerMessage );
      }
    }
  }

  /***/

  private combineApiRequests( ): Observable<any> {
    let apiTickerObservable = this.apiTicker.response.getListener( ).map(
      response => {
        let apiChannelMessage = {
          requestId: this.apiTicker.requestId,
          data: response.json( )
        };

        return apiChannelMessage;
      }
    );

    let apiStatsObservable = this.apiStats.response.getListener( ).map(
      response => {
        let apiChannelMessage = {
          requestId: this.apiStats.requestId,
          data: response.json( )
        };

        return apiChannelMessage;
      }
    )

    return Observable.zip( apiTickerObservable, apiStatsObservable, (ticker, stats) => {
      let tickerMessage = new GdaxTickerMessage( );
      tickerMessage.channelIdentifier = 'ticker_' + this.symbol;
      tickerMessage.messageType = 'ticker';

      tickerMessage.lastPrice = ticker.data.price;
      tickerMessage.high = stats.data.high;
      tickerMessage.low = stats.data.low;
      tickerMessage.ask = ticker.data.ask;
      tickerMessage.askSize = ticker.data.size;
      tickerMessage.bid = ticker.data.bid;
      tickerMessage.bidSize = ticker.data.size;
      tickerMessage.volume = stats.data.volume;
      tickerMessage.dailyChange = ( tickerMessage.lastPrice - stats.data.open );
      tickerMessage.dailyChangePercent = ( ( tickerMessage.lastPrice - stats.data.open ) / stats.data.open ) * 100;

      tickerMessage.source = ticker.data;

      return tickerMessage;
    });
  }
}

export class GdaxTradeChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  public apiTrades: RequestItem;

  private _tickerChannel: GdaxTickerChannel;
  protected listener: BehaviorSubject<IChannelMessage>;
  private _tickerListener: Observable<IChannelMessage>;

  constructor( ) {
    super();

    this.listener = new BehaviorSubject<IChannelMessage>( null );
  }

  public applyTickerSubscription( tickerSubscription: GdaxChannelSubscription ): void {
    this._tickerListener = tickerSubscription.listener;
  }

  public getSubscribeMessage( options?: any ): string {
    return 'NOT USED';
  }

  public getUnsubscribeMessage( ): string {
    return 'NOT USED';
  }

  public getSubscription( ): IChannelSubscription {
    if (this.apiTrades) {
      this.apiTrades.response.getListener( ).subscribe(
        response => {
          let apiChannelMessage = {
            requestId: this.apiTrades.requestId,
            source: 'REST_API',
            data: response.json( )
          };

          this.sendMessage( apiChannelMessage );
        }
      );
    }

    this._tickerListener.filter( item => item !== null ).map( item => {
      let tickerMessage = item as GdaxTickerMessage;
      let tradeMessage = new GdaxTradeMessage( );

      if (!tickerMessage.source) {
        return;
      }

      tradeMessage.channelIdentifier = 'trade_' + this.symbol;

      console.log( 'tickerMessage: ' + JSON.stringify( tickerMessage ) );

      if (tickerMessage.source.hasOwnProperty('trade_id')) {
        tradeMessage.tradeId = tickerMessage.source.trade_id;
        tradeMessage.orderPrice = tickerMessage.lastPrice;
        tradeMessage.amount = tickerMessage.volume;
        tradeMessage.timestamp = new Date( Date.parse( tickerMessage.source.time ) );
        tradeMessage.orderType = tickerMessage.source.side === 'buy' ? OrderType.BuyOrder : OrderType.SellOrder;
      } else {
        tradeMessage.tradeId = -1;
        tradeMessage.orderPrice = tickerMessage.lastPrice;
        tradeMessage.amount = tickerMessage.volume;
      }

      return tradeMessage;
    }).subscribe( message => {
      this.sendMessage( message );
    })

    return new GdaxChannelSubscription( this, this.pair, this.listener.filter(item => item !== null));
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( 'GdaxTradeChannel | sendMessage | parsedMessage: ' + parsedMessage );

    if (parsedMessage) {
      if (parsedMessage instanceof GdaxTradeMessage) {
        this.listener.next( parsedMessage );
      } else {
        if (parsedMessage.source === 'REST_API') {
          if (parsedMessage.data instanceof Array) {
            let tradeSnapshotMessage = new GdaxTradeSnapshotMessage( );
            tradeSnapshotMessage.channelIdentifier = 'trade_' + this.symbol;

            parsedMessage.data.forEach( trade => {
              let tradeMessage = new GdaxTradeMessage( );
              tradeMessage.channelIdentifier = 'trade_' + this.symbol;
              tradeMessage.timestamp = new Date( Date.parse( trade.time ));
              tradeMessage.tradeId = trade.trade_id;
              tradeMessage.orderPrice = trade.price;
              tradeMessage.amount = trade.size;
              tradeMessage.orderType = trade.side === 'buy' ? OrderType.BuyOrder : OrderType.SellOrder;

              tradeSnapshotMessage.messages.push( tradeMessage );
            });

            this.listener.next( tradeSnapshotMessage );
          }
        }
        // #region unused
        // } else {
        //   let tradeMessage = new GdaxTradeMessage( );

        //   tradeMessage.channelIdentifier = parsedMessage.type + '_' + parsedMessage.product_id;
        //   tradeMessage.messageType = 'ticker';
        //   tradeMessage.isSnapshot = false;

        //   tradeMessage.tradeId = parsedMessage.trade_id;
        //   tradeMessage.timestamp = new Date( Date.parse( parsedMessage.time ) );
        //   tradeMessage.orderType = parsedMessage.side === 'buy' ? OrderType.BuyOrder : OrderType.SellOrder;
        //   tradeMessage.amount = parsedMessage.last_size;
        //   tradeMessage.orderPrice = parsedMessage.price;

        //   this.listener.next( tradeMessage );
        // }
        // #endregion
      }
    }
  }
}

export class GdaxBooksChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<IChannelMessage>;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<IChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    let message = {
      'event': 'subscribe',
      'channel': 'book',
      'symbol': this.symbol,
      'prec': 'P0',
      'freq': 'F0',
      'length': '25'
    };

    if (options) {
      if (options.precision) {
        message.prec = options.precision;
      }
      if (options.frequency) {
        message.freq = options.frequency;
      }
      if (options.length) {
        message.length = options.length;
      }
    }

    return JSON.stringify(message);
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'TODO': 'todo'
    });
  }

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new GdaxChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
  }
}

export class GdaxCandleChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<IChannelMessage>;

  public apiCandles: RequestItem;

  constructor( ) {
    super();

    this.listener = new BehaviorSubject<IChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    let message = {
      'event': 'subscribe',
      'channel': 'candles',
      'key': this.symbol
    };

    return JSON.stringify(message);
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'TODO': 'todo'
    });
  }

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );

    if (this.apiCandles) {
      this.mapCandles( ).subscribe(
        response => {
          let apiRequestMessage = {
            source: 'REST_API',
            data: response as GdaxCandleSnapshotMessage
          };

          this.sendMessage( apiRequestMessage );
        }
      );
    }

    return new GdaxChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'GdaxCandleChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage.source === 'REST_API') {
        this.listener.next( parsedMessage.data );
      } else {
        let candleMessage = new GdaxCandleMessage( );
        // TODO:

        this.listener.next( candleMessage );
      }
    }
  }

  /***/

  private mapCandles( ): Observable<any> {
    let apiCandlesObservable = this.apiCandles.response.getListener( ).map(
      response => {
        console.log( 'mapCandles | response received' );
        let data = response.json( );

        if (data) {
          if (data instanceof Array) {
            let snapshot = new GdaxCandleSnapshotMessage( );
            snapshot.channelIdentifier = 'candles_' + this.symbol;

            data.forEach( candle => {
              let candleMessage = new GdaxCandleMessage( );
              candleMessage.channelIdentifier = '';
              candleMessage.timestamp = new Date(candle[0] * 1000);
              candleMessage.open = candle[1];
              candleMessage.close = candle[2];
              candleMessage.high = candle[3];
              candleMessage.low = candle[4];
              candleMessage.volume = candle[5];

              snapshot.messages.push( candleMessage );
            });

            return snapshot;
          }
        }

        return new GdaxCandleSnapshotMessage( );
      }
    );

    return apiCandlesObservable;
  }
}
