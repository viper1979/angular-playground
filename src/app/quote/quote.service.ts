import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class QuoteService {
  private _this;
  private _apiUrl: string = 'wss://api.bitfinex.com/ws/2';
  private _socketConnection: WebSocket;

  private _listener: BehaviorSubject<TradeMessage>;

  constructor() {
    this._this = this;
    this._listener = new BehaviorSubject<TradeMessage>( null );

    if (this.initBitfenix( )) {
    }
  }

  getListener( ): Observable<TradeMessage> {
    return this._listener.filter( item => item !== null );
  }

  private initBitfenix( ): boolean {
    this._socketConnection = new WebSocket( this._apiUrl );
    this._socketConnection.onopen = this.onOpen.bind(this); // bind(this) preserves the this-context for the called method
    this._socketConnection.onerror = this.onError;
    this._socketConnection.onclose = this.onClose;
    this._socketConnection.onmessage = this.onMessage.bind(this);

    return true;
  }

  private onMessage(message: MessageEvent): any {
    let parsedMessage = JSON.parse(message.data);
    if (parsedMessage && parsedMessage[1] === 'tu') {
      // console.log( 'QuoteService | onMessage: ' + JSON.stringify(message.data));
      let tradeMessage = new TradeMessage( );
      tradeMessage.channelId = parsedMessage[0];
      tradeMessage.messageType = parsedMessage[1];
      tradeMessage.tradeId = parsedMessage[2][0];
      tradeMessage.timestamp = new Date(parsedMessage[2][1]);
      tradeMessage.amount = parsedMessage[2][2];
      tradeMessage.orderPrice = parsedMessage[2][3];

      this._listener.next(tradeMessage);

      // console.log( 'QuoteService | onMessage: ' + JSON.stringify(message.data));
      console.log( 'QuoteService | onMessage: ' + JSON.stringify(tradeMessage));
    }
  }

  private onOpen(event: Event) {
    console.log( 'QuoteService | onOpen: ' + JSON.stringify(event));

    let message = {
      'event': 'subscribe',
      'channel': 'trades',
      'pair': 'BTCUSD'
    };

    this._socketConnection.send(JSON.stringify(message));
  }

  private onClose(event: CloseEvent): any {
    console.log( 'QuoteService | onClose: ' + JSON.stringify(event));
  }

  private onError(event: Event): any {
    console.log( 'QuoteService | onError: ' + JSON.stringify(event));
  }

  private parseTimestamp( timestamp ): Date {
    return new Date(timestamp);
  }
}

export class TradeMessage {
  channelId: number;
  messageType: string;

  tradeId: number;
  timestamp: Date;

  private _amount: number;
  set amount(value) {
    this._amount = value;
    if (value >= 0) {
      this.orderType = 'BUY';
    } else {
      this.orderType = 'SELL';
    }
  }
  get amount() {
    return this._amount;
  }

  orderType: string;
  orderPrice: number;

  constructor() {
  }
}
