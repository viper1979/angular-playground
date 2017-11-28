import { EventEmitter } from '@angular/core';
import { IChannel } from 'app/shared/exchange-handler/interfaces/channels';
import { IChannelMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { GdaxTickerMessage, GdaxChannelMessage, GdaxTickerSnapshotMessage } from 'app/api/gdax/gdax-channel-messages';
import { tick } from '@angular/core/testing';
import { RequestItem } from 'app/shared/api-request-queue/api-request-queue';

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

export class GdaxTradeChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<IChannelMessage>;

  constructor( ) {
    super();
    this.listener = new BehaviorSubject<IChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'trades',
      'symbol': 't' + this.pair
    });
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'TODO': 'todo'
    });
  }

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new GdaxChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // TODO:
  }
}

export class GdaxTickerChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<IChannelMessage>;
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
    console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage.source === 'REST_API') {
        this.listener.next( parsedMessage.data );
     } else {
        let tickerMessage = new GdaxTickerMessage( );
        tickerMessage.channelIdentifier = parsedMessage.type + '_' + parsedMessage.product_id;
        tickerMessage.messageType = 'ticker';
        tickerMessage.isSnapshot = false;

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

      return tickerMessage;
    });
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
    return new GdaxChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
  }
}
