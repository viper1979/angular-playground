import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { BitfinexChannelMessage, TradeMessage, TickerMessage, BookMessage, CandleMessage, CandleSnapshotMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { EventEmitter } from '@angular/core';

export class BitfinexChannelSubscription {
  protected readonly _channel: BitfinexChannel;
  public heartbeat: EventEmitter<{channel: string, timestamp: Date}>;

  get channelId(): number {
    return this._channel.channelId;
  }
  get channel(): string {
    return this._channel.channel;
  }

  public readonly pair: string;
  public readonly listener: Observable<BitfinexChannelMessage>;

  constructor( channel: BitfinexChannel, pair: string, listener: Observable<BitfinexChannelMessage> ) {
    this._channel = channel;
    this.pair = pair;
    this.listener = listener;

    this.heartbeat = new EventEmitter<{channel: string, timestamp: Date}>( );
    this._channel.heartbeat.subscribe( event => {
      this.heartbeat.emit( event );
    })
  }
}

export abstract class BitfinexChannel {
  public channelId: number;
  public channel: string;
  public heartbeat: EventEmitter<{channel: string, timestamp: Date}>;
  protected subscription: BitfinexChannelSubscription;

  abstract getSubscribeMessage( options?: any ): string;
  abstract getSubscription( ): BitfinexChannelSubscription;
  abstract sendMessage( parsedMessage: any ): void;

  public sendHeartbeat( ): void {
    this.heartbeat.emit({ channel: this.channel, timestamp: new Date() });
  }

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'event': 'unsubscribe',
      'chanId': this.channelId
    });
  }

  constructor( ) {
    this.heartbeat = new EventEmitter<{channel: string, timestamp: Date}>( );
  }
}

export class BitfinexTradeChannel extends BitfinexChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<BitfinexChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfinexChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'trades',
      'symbol': 't' + this.pair
    });
  }

  public getSubscription( ): BitfinexChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    if (parsedMessage) {
      if (parsedMessage[1] instanceof Array) {
        parsedMessage[1].forEach(element => {
          let tradeMessage = new TradeMessage( );
          tradeMessage.channelId = parsedMessage[0];
          tradeMessage.messageType = 'tu';
          tradeMessage.tradeId = element[0];
          tradeMessage.timestamp = new Date(element[1]);
          tradeMessage.amount = element[2];
          tradeMessage.orderPrice = element[3];

          this.listener.next( tradeMessage );
        });
      } else {
        if (parsedMessage[1] === 'tu') {
          let tradeMessage = new TradeMessage( );
          tradeMessage.channelId = parsedMessage[0];
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
  private listener: BehaviorSubject<BitfinexChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfinexChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'ticker',
      'symbol': 't' + this.pair
    });
  }

  public getSubscription( ): BitfinexChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      let tickerMessage = new TickerMessage( );
      tickerMessage.channelId = parsedMessage[0];
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
  private listener: BehaviorSubject<BitfinexChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfinexChannelMessage>( null );
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

  public getSubscription( ): BitfinexChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'BitfenixBooksChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage[1][0] instanceof Array) {
        parsedMessage[1].forEach(element => {
          let bookMessage = new BookMessage( );
          bookMessage.channelId = parsedMessage[0];
          bookMessage.price = element[0];
          bookMessage.count = element[1];
          bookMessage.amount = element[2];

          this.listener.next( bookMessage );
        });
      } else {

        let bookMessage = new BookMessage( );
        bookMessage.channelId = parsedMessage[0];
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
  private listener: BehaviorSubject<BitfinexChannelMessage>;

  constructor( ) {
    super();

    this.listener = new BehaviorSubject<BitfinexChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    let message = {
      'event': 'subscribe',
      'channel': 'candles',
      'key': this.symbol
    };

    return JSON.stringify(message);
  }

  public getSubscription( ): BitfinexChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfinexChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    // console.log( 'BitfinexCandleChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage[1][0] instanceof Array) {
        let snapshot: CandleSnapshotMessage = new CandleSnapshotMessage( );
        snapshot.channelId = parsedMessage[0];

        parsedMessage[1].forEach(element => {
          let candleMessage = new CandleMessage( );
          candleMessage.channelId = parsedMessage[0];
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

        let candleMessage = new CandleMessage( );
        candleMessage.channelId = parsedMessage[0];
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
