import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { BitfenixChannelMessage, TradeMessage, TickerMessage, BookMessage } from 'app/api/bitfenix/bitfenix-channel-messages';
import { EventEmitter } from '@angular/core';

export class BitfenixChannelSubscription {
  protected readonly _channel: BitfenixChannel;

  get channelId(): number {
    return this._channel.channelId;
  }
  get channel(): string {
    return this._channel.channel;
  }

  public readonly pair: string;
  public readonly listener: Observable<BitfenixChannelMessage>;

  constructor( channel: BitfenixChannel, pair: string, listener: Observable<BitfenixChannelMessage> ) {
    this._channel = channel;
    this.pair = pair;
    this.listener = listener;
  }
}

export abstract class BitfenixChannel {
  public channelId: number;
  public channel: string;
  public heartbeat: EventEmitter<{channel: string, timestamp: Date}>;
  protected subscription: BitfenixChannelSubscription;

  abstract getSubscribeMessage( options?: any ): string;
  abstract getSubscription( ): BitfenixChannelSubscription;
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

export class BitfenixTradeChannel extends BitfenixChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<BitfenixChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfenixChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'trades',
      'symbol': 't' + this.pair
    });
  }

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this, this.pair, listener );
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

export class BitfenixTickerChannel extends BitfenixChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<BitfenixChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfenixChannelMessage>( null );
  }

  public getSubscribeMessage( options?: any ): string {
    return JSON.stringify({
      'event': 'subscribe',
      'channel': 'ticker',
      'symbol': 't' + this.pair
    });
  }

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( 'TickerMessage | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

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

export class BitfenixBooksChannel extends BitfenixChannel {
  public symbol: string;
  public pair: string;
  private listener: BehaviorSubject<BitfenixChannelMessage>;
  private isSubscribed: boolean;

  constructor( ) {
    super();

    this.isSubscribed = false;
    this.listener = new BehaviorSubject<BitfenixChannelMessage>( null );
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

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( 'BitfenixBooksChannel | sendMessage | parsedMessage: ' + JSON.stringify(parsedMessage) );

    if (parsedMessage) {
      if (parsedMessage[1] instanceof Array) {
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
