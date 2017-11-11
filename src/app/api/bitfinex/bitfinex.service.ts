import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { BitfinexChannel, BitfinexTradeChannel, BitfinexTickerChannel, BitfinexChannelSubscription, BitfinexBooksChannel, BitfinexCandleChannel } from 'app/api/bitfinex/bitfinex-channels';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import 'rxjs/Rx';

@Injectable()
export class BitfinexService extends ExchangeService {
  readonly exchangeName: string;
  private _this;
  private _apiUrl: string = 'wss://api.bitfinex.com/ws/2';
  private _socketConnection: WebSocket;
  private _availableSymbols: string[] = [
    'BTCUSD', 'LTCUSD', 'LTCBTC', 'ETHUSD', 'ETHBTC', 'ETCBTC', 'ETCUSD', 'RRTUSD', 'RRTBTC', 'ZECUSD', 'ZECBTC', 'XMRUSD', 'XMRBTC',
    'DSHUSD', 'DSHBTC', 'BCCBTC', 'BCUBTC', 'BCCUSD', 'BCUUSD', 'XRPUSD', 'XRPBTC', 'IOTUSD', 'IOTBTC', 'IOTETH', 'EOSUSD', 'EOSBTC',
    'EOSETH', 'SANUSD', 'SANBTC', 'SANETH', 'OMGUSD', 'OMGBTC', 'OMGETH', 'BCHUSD', 'BCHBTC', 'BCHETH', 'NEOUSD', 'NEOBTC', 'NEOETH',
    'ETPUSD', 'ETPBTC', 'ETPETH', 'QTMUSD', 'QTMBTC', 'QTMETH', 'BT1USD', 'BT2USD', 'BT1BTC', 'BT2BTC', 'AVTUSD', 'AVTBTC', 'AVTETH',
    'EDOUSD', 'EDOBTC', 'EDOETH', 'BTGUSD', 'BTGBTC'
  ];

  private _activeSubscriptions: Map<number, BitfinexChannel>;
  private _queuedSubscriptions: Map<string, BitfinexChannel>;

  constructor() {
    super( );

    this.exchangeName = 'Bitfinex';
    this._activeSubscriptions = new Map<number, BitfinexChannel>( );
    this._queuedSubscriptions = new Map<string, BitfinexChannel>( );

    if (this.initBitfenix( )) {
    }
  }

  getAvailableSymbols( ): string[] {
    return this._availableSymbols;
  }

  getTrades( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'BitfinexService | getTradeListener | symbol: ' + symbol);

    let tradeChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as BitfinexTradeChannel) !== undefined ) as BitfinexTradeChannel[];
    let channel = tradeChannels.find( item => item.symbol === symbol );

    if (!channel && this._queuedSubscriptions.has( 'trades_t' + symbol)) {
      channel = this._queuedSubscriptions.get( 'trades_t' + symbol) as BitfinexTradeChannel;
    }

    if (!channel) {
      channel = new BitfinexTradeChannel( );
      channel.pair = symbol
      channel.symbol = 't' + symbol;
      this._queuedSubscriptions.set( 'trades_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        this._socketConnection.send( channel.getSubscribeMessage( ) );
      }
    }

    return channel.getSubscription( );
  }

  getTicker( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'BitfinexService | getTickerListener | symbol: ' + symbol );

    let tradeChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as BitfinexTickerChannel) !== undefined ) as BitfinexTickerChannel[];
    let channel = tradeChannels.find( item => item.symbol === symbol );

    if (!channel && this._queuedSubscriptions.has( 'ticker_t' + symbol)) {
      channel = this._queuedSubscriptions.get( 'ticker_t' + symbol) as BitfinexTickerChannel;
    }

    if (!channel) {
      channel = new BitfinexTickerChannel( );
      channel.pair = symbol;
      channel.symbol = 't' + symbol;
      this._queuedSubscriptions.set( 'ticker_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        this._socketConnection.send( channel.getSubscribeMessage( ) );
      }
    }

    return channel.getSubscription( );
  }

  getOrderBooks( symbol: string, options?: { prec: string, freq: string, length: string} ): IChannelSubscription {
    let booksChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as BitfinexBooksChannel) !== undefined ) as BitfinexBooksChannel[];
    let channel = booksChannels.find( item => item.symbol === symbol );

    if (!channel && this._queuedSubscriptions.has( 'book_t' + symbol)) {
      channel = this._queuedSubscriptions.get( 'book_t' + symbol) as BitfinexBooksChannel;
    }

    if (!channel) {
      channel = new BitfinexBooksChannel( );
      channel.pair = symbol;
      channel.symbol = 't' + symbol;
      this._queuedSubscriptions.set( 'book_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        this._socketConnection.send( channel.getSubscribeMessage( options ) );
      }
    }

    return channel.getSubscription( );
  }

  getCandles( symbol: string, options?: {timeframe: string}): IChannelSubscription {
    let finalSymbol = 'trade:' + (options ? options.timeframe : '1m') + ':t' + symbol.toUpperCase();

    let candleChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as BitfinexCandleChannel) !== undefined ) as BitfinexCandleChannel[];
    let channel = candleChannels.find( item => item.symbol === finalSymbol );

    if (!channel && this._queuedSubscriptions.has( 'candles_' + finalSymbol)) {
      channel = this._queuedSubscriptions.get( 'candles_' + finalSymbol) as BitfinexCandleChannel;
    }

    if (!channel) {
      channel = new BitfinexCandleChannel( );
      channel.symbol = finalSymbol;
      this._queuedSubscriptions.set( 'candles_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        this._socketConnection.send( channel.getSubscribeMessage( ) );
      }
    }

    return channel.getSubscription( );
  }

  unsubscribe( subscription: IChannelSubscription ): boolean {
    if (this._activeSubscriptions.has( subscription.channelIdentifier )) {
      let channel = this._activeSubscriptions.get( subscription.channelIdentifier );

      if (this._socketConnection && this._socketConnection.readyState === 1) {
        this._socketConnection.send( channel.getUnsubscribeMessage( ) );
        return true;
      }
    }

    return false;
  }

  /***/

  private initBitfenix( ): boolean {
    this._socketConnection = new WebSocket( this._apiUrl );
    this._socketConnection.onopen = this.onOpen.bind(this); // bind(this) preserves the this-context for the called method
    this._socketConnection.onerror = this.onError.bind(this);
    this._socketConnection.onclose = this.onClose.bind(this);
    this._socketConnection.onmessage = this.onMessage.bind(this);

    return true;
  }

  private onMessage(message: MessageEvent): any {
    let parsedMessage = JSON.parse(message.data);

    if (parsedMessage) {
      if (parsedMessage.hasOwnProperty('event')) {
        switch (parsedMessage.event) {
          case 'info': {
            console.log( '### INFO: ' + JSON.stringify(parsedMessage) );
            break;
          }
          case 'conf': {
            console.log( '### CONF: ' + JSON.stringify(parsedMessage) );
            break;
          }
          case 'pong': {
            console.log( '### PONG: ' + JSON.stringify(parsedMessage) );
            break;
          }
          case 'subscribed': {
            this.subscriptionReceived(parsedMessage);
            break;
          }
          case 'unsubscribed': {
            this.unsubscribeReceived(parsedMessage);
            break;
          }
          case 'error': {
            console.log( '### ERROR: ' + JSON.stringify(parsedMessage) );
            break;
          }
          default: {
            // update message
            break;
          }
        }
      } else {
        let channelId: number = parsedMessage[0];

        if (this._activeSubscriptions.has(channelId) ) {
          if (parsedMessage[1] === 'hb') {
            this._activeSubscriptions.get(channelId).sendHeartbeat();
          } else {
            this._activeSubscriptions.get(channelId).sendMessage( parsedMessage );
          }
        }
        // console.log( 'BitfinexService | onMessage: ' + JSON.stringify(parsedMessage));
      }
    }
  }

  private onOpen(event: Event) {
    console.log( 'BitfinexService | onOpen: ' + JSON.stringify(event));

    if (this._queuedSubscriptions.size > 0) {
      console.log( 'BitfinexService | Items in queue: ' + this._queuedSubscriptions.size);

      this._queuedSubscriptions.forEach( item => {
        this._socketConnection.send( item.getSubscribeMessage( ) );
      })
    }
  }

  private onClose(event: CloseEvent): any {
    console.log( 'BitfinexService | onClose: ' + JSON.stringify(event));
  }

  private onError(event: Event): any {
    console.log( 'BitfinexService | onError: ' + JSON.stringify(event));
  }

  /***/

  private subscriptionReceived( parsedMessage: ITradeSubscription ): void {
    console.log( '### SUBSCRIBED: ' + JSON.stringify(parsedMessage) );

    let pair = parsedMessage.pair;
    let symbol = parsedMessage.symbol;
    let key = parsedMessage['key'];
    let channel = parsedMessage.channel;
    let cacheKey: string;

    if (this._queuedSubscriptions.has(channel + '_' + pair)) {
      cacheKey = channel + '_' + pair;
    }
    if (this._queuedSubscriptions.has(channel + '_' + symbol)) {
      cacheKey = channel + '_' + symbol;
    }
    if (this._queuedSubscriptions.has(channel + '_' + key)) {
      cacheKey = channel + '_' + key;
    }

    if (cacheKey && cacheKey.length > 0) {
      let bitfenixChannel = this._queuedSubscriptions.get(cacheKey);
      bitfenixChannel.channelName = parsedMessage.channel;
      bitfenixChannel.channelIdentifier = parsedMessage.chanId;

      this._activeSubscriptions.set(bitfenixChannel.channelIdentifier, bitfenixChannel);
      this._queuedSubscriptions.delete(cacheKey);
    } else {
      console.log('No queued subscription found for currency-pair: ' + pair);
    }
  }

  private unsubscribeReceived( parsedMessage: ITradeUnsubscribe ): void {
    console.log( '### UNSUBSCRIBED: ' + JSON.stringify(parsedMessage) );

    if (this._activeSubscriptions.has(parsedMessage.chanId)) {
      this._activeSubscriptions.delete(parsedMessage.chanId);
    }
  }
}

export interface ITradeSubscription {
  event: string;
  channel: string;
  chanId: number;
  symbol: string;
  pair: string;
}

export interface ITradeUnsubscribe {
  event: string;
  status: string;
  chanId: number;
}
