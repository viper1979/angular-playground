import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { BitfenixChannelMessage, TradeMessage } from 'app/api/bitfenix/bitfenix-channel-messages';
import { EventEmitter } from '@angular/core';

export class BitfenixChannelSubscription {
  public readonly channelId: number;
  public readonly channel: string;
  public readonly pair: string;
  public readonly listener: Observable<BitfenixChannelMessage>;

  constructor( channel: string, pair: string, listener: Observable<BitfenixChannelMessage> ) {
    this.channel = channel;
    this.pair = pair;
    this.listener = listener;
  }
}

export abstract class BitfenixChannel {
  public channelId: number;
  public channel: string;
  public heartbeat: EventEmitter<{channel: string, timestamp: Date}>;

  abstract getSubscribeMessage( options?: any ): string;
  abstract getUnsubscribeMessage( ): string;
  abstract getSubscription( ): BitfenixChannelSubscription;
  abstract sendMessage( parsedMessage: any ): void;

  public sendHeartbeat( ): void {
    this.heartbeat.emit({ channel: this.channel, timestamp: new Date() });
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

  public getUnsubscribeMessage( ): string {
    return JSON.stringify({
      'event': 'unsubscribe',
      'chanId': this.channelId
    });
  }

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this.channel, this.pair, listener );
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

  public getUnsubscribeMessage( ): string {
    return JSON.stringify('');
  }

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this.channel, this.pair, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( 'BitfenixTickerChannel | sendMessage | TODO: send message')
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

  public getUnsubscribeMessage( ): string {
    return JSON.stringify('');
  }

  public getSubscription( ): BitfenixChannelSubscription {
    let listener = this.listener.filter( item => item !== null );
    return new BitfenixChannelSubscription( this.channel, this.symbol, listener );
  }

  public sendMessage( parsedMessage: any ): void {
    console.log( 'BitfenixBooksChannel | sendMessage | TODO: send message')
  }
}
