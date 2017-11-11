import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { BitfinexTradeMessage, BitfinexTickerMessage, BitfinexOrderbookMessage, BitfinexCandleMessage, BitfinexCandleSnapshotMessage, BitfinexTradeSnapshotMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { EventEmitter } from '@angular/core';
import { IChannel } from 'app/shared/exchange-handler/interfaces/channels';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { IChannelMessage, ICandleMessage, IOrderbookMessage, ITickerMessage, ITradeMessage, ICandleSnapshotMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

export class BitfinexChannelSubscription implements IChannelSubscription {
  protected readonly _channel: IChannel;
  public heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;

  get channelIdentifier(): number {
    return this._channel.channelIdentifier;
  }
  get channelName(): string {
    return this._channel.channelName;
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

export abstract class BitfinexChannel implements IChannel {
  public channelIdentifier: number;
  public channelName: string;
  public heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;
  protected subscription: IChannelSubscription;

  abstract getSubscribeMessage( options?: any ): string;
  abstract getSubscription( ): IChannelSubscription;
  abstract sendMessage( parsedMessage: any ): void;

  public sendHeartbeat( ): void {
    this.heartbeat.emit({ channelName: this.channelName, timestamp: new Date() });
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'event': 'unsubscribe',
      'chanId': this.channelIdentifier
    });
  }

  constructor( ) {
    this.heartbeat = new EventEmitter<{channelName: string, timestamp: Date}>( );
  }
}

export class BitfinexTradeChannel extends BitfinexChannel {
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

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    if (parsedMessage) {
      if (parsedMessage[1] instanceof Array) {
        let snapshot = new BitfinexTradeSnapshotMessage( );
        snapshot.channelIdentifier = parsedMessage[0];

        parsedMessage[1].forEach(element => {
          let tradeMessage = new BitfinexTradeMessage( );
          tradeMessage.channelIdentifier = parsedMessage[0];
          tradeMessage.messageType = 'tu';
          tradeMessage.tradeId = element[0];
          tradeMessage.timestamp = new Date(element[1]);
          tradeMessage.amount = element[2];
          tradeMessage.orderPrice = element[3];

          snapshot.messages.push( tradeMessage );
        });

        this.listener.next( snapshot );
      } else {
        if (parsedMessage[1] === 'tu') {
          let tradeMessage = new BitfinexTradeMessage( );
          tradeMessage.channelIdentifier = parsedMessage[0];
          tradeMessage.messageType = parsedMessage[1];
          tradeMessage.tradeId = parsedMessage[2][0];
          tradeMessage.timestamp = new Date(parsedMessage[2][1]);
          tradeMessage.amount = parsedMessage[2][2];
          tradeMessage.orderPrice = parsedMessage[2][3];

          this.listener.next( tradeMessage );
        }
      }
    }
  }
}

export class BitfinexTickerChannel extends BitfinexChannel {
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
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'ticker',
      'symbol': 't' + this.pair
    });
  }

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      let tickerMessage = new BitfinexTickerMessage( );
      tickerMessage.channelIdentifier = parsedMessage[0];
      tickerMessage.messageType = 'ticker';
      tickerMessage.bid = parsedMessage[1][0];
      tickerMessage.bidSize = parsedMessage[1][1];
      tickerMessage.ask = parsedMessage[1][2];
      tickerMessage.askSize = parsedMessage[1][3];
      tickerMessage.dailyChange = parsedMessage[1][4];
      tickerMessage.dailyChangePercent = parsedMessage[1][5];
      tickerMessage.lastPrice = parsedMessage[1][6];
      tickerMessage.volume = parsedMessage[1][7];
      tickerMessage.high = parsedMessage[1][8];
      tickerMessage.low = parsedMessage[1][9];

      this.listener.next( tickerMessage );
    }
  }
}

export class BitfinexBooksChannel extends BitfinexChannel {
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

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'BitfenixBooksChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage[1][0] instanceof Array) {
        parsedMessage[1].forEach(element => {
          let bookMessage = new BitfinexOrderbookMessage( );
          bookMessage.channelIdentifier = parsedMessage[0];
          bookMessage.price = element[0];
          bookMessage.count = element[1];
          bookMessage.amount = element[2];

          this.listener.next( bookMessage );
        });
      } else {

        let bookMessage = new BitfinexOrderbookMessage( );
        bookMessage.channelIdentifier = parsedMessage[0];
        bookMessage.price = parsedMessage[1][0];
        bookMessage.count = parsedMessage[1][1];
        bookMessage.amount = parsedMessage[1][2];

        this.listener.next( bookMessage );
      }
    }
  }
}

export class BitfinexCandleChannel extends BitfinexChannel {
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

  public getSubscription( ): IChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'BitfinexCandleChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage[1][0] instanceof Array) {
        let snapshot: BitfinexCandleSnapshotMessage = new BitfinexCandleSnapshotMessage( );
        snapshot.channelIdentifier = parsedMessage[0];

        parsedMessage[1].forEach(element => {
          let candleMessage = new BitfinexCandleMessage( );
          candleMessage.channelIdentifier = parsedMessage[0];
          candleMessage.timestamp = new Date(element[0]);
          candleMessage.open = element[1];
          candleMessage.close = element[2];
          candleMessage.high = element[3];
          candleMessage.low = element[4];
          candleMessage.volume = element[5];

          snapshot.messages.push( candleMessage );
          // this.listener.next( candleMessage );
        });

        this.listener.next( snapshot );
      } else {

        let candleMessage = new BitfinexCandleMessage( );
        candleMessage.channelIdentifier = parsedMessage[0];
        candleMessage.timestamp = new Date(parsedMessage[1][0]);
        candleMessage.open = parsedMessage[1][1];
        candleMessage.close = parsedMessage[1][2];
        candleMessage.high = parsedMessage[1][3];
        candleMessage.low = parsedMessage[1][4];
        candleMessage.volume = parsedMessage[1][5];

        this.listener.next( candleMessage );
      }
    }
  }
}
