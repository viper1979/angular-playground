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

  abstract getSubscribeMessage( options?: any ): string;
  abstract getSubscription( ): IChannelSubscription;
  abstract sendMessage( parsedMessage: any ): void;

  public sendHeartbeat( ): void {
    this.heartbeat.emit({ channelName: this.channelName, timestamp: new Date() });
  }

  abstract getUnsubscribeMessage( ): string;

  constructor( ) {
    this.heartbeat = new EventEmitter<{channelName: string, timestamp: Date}>( );
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
  public requestItem: RequestItem;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
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

    if (this.requestItem) {
      listener = listener.merge(
        this.requestItem.response.getListener( ).map(
          response => {
            let channelMessage: IChannelMessage;




            return {
              requestId: this.requestItem.requestId,
              messages: response
            } as IChannelMessage;


            let responseArray: any = response.json( );
            let tickerSnapshotMessage = new GdaxTickerSnapshotMessage( );

            // Array.from( responseArray ).forEach( item => {
            //   let tickerMessage = new GdaxTickerMessage() );
            //   tickerMessage.channelIdentifier = 'ticker_' + this.symbol;
            //   tickerMessage.messageType = 'ticker';

            //   tickerMessage.lastPrice = parsedMessage.price;
            //   tickerMessage.isSnapshot = false;
            //   tickerMessage.volume = parsedMessage.volume_24h;
            //   tickerMessage.low = parsedMessage.low_24h;
            //   tickerMessage.high = parsedMessage.high_24h;
            //   tickerMessage.bid = parsedMessage.best_bid;
            //   tickerMessage.ask = parsedMessage.best_ask;

            // time	"2017-11-26T12:59:04.248Z"
            // trade_id	898
            // price	"7576.55000000"
            // size	"0.01000000"
            // side	"sell"

            })
        );
    }

    return new GdaxChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( '');

    // console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    // if (parsedMessage) {

    //   if (parsedMessage instanceof Array) {
    //     console.log( 'bla' );
    //   } else {
    //     let tickerMessage = new GdaxTickerMessage( );
    //     tickerMessage.channelIdentifier = parsedMessage.type + '_' + parsedMessage.product_id;
    //     tickerMessage.messageType = 'ticker';
    //     tickerMessage.lastPrice = parsedMessage.price;
    //     tickerMessage.isSnapshot = false;
    //     tickerMessage.volume = parsedMessage.volume_24h;
    //     tickerMessage.low = parsedMessage.low_24h;
    //     tickerMessage.high = parsedMessage.high_24h;
    //     tickerMessage.bid = parsedMessage.best_bid;
    //     tickerMessage.ask = parsedMessage.best_ask;

    //     tickerMessage.dailyChange = ( tickerMessage.lastPrice - parsedMessage.open_24h );
    //     tickerMessage.dailyChangePercent = ( ( tickerMessage.lastPrice - parsedMessage.open_24h ) / parsedMessage.open_24h ) * 100;

    //     this.listener.next( tickerMessage );
    //   }
    // }
  }
}

export class GdaxBooksChannel extends GdaxChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<IChannelMessage>;
  private isSubscribed: boolean;

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
