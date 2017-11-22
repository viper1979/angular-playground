import { Injectable } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { HttpClient } from 'selenium-webdriver/http';
import { Http } from '@angular/http';
import { Product } from 'app/api/gdax/models/product';
import { forEach } from '@angular/router/src/utils/collection';
import { Observable } from 'rxjs/Observable';
import { GdaxTradeChannel, GdaxTickerChannel, GdaxBooksChannel, GdaxCandleChannel, GdaxChannel } from 'app/api/gdax/gdax-channels';
import { parse } from 'querystring';

@Injectable()
export class GdaxService extends ExchangeService {
  readonly exchangeName: string;
  private _wssUrl: string;
  private _apiUrl: string;
  private _socketConnection: WebSocket;
  private _products: Product[];

  private _activeSubscriptions: Map<string, GdaxChannel>;
  private _queuedSubscriptions: Map<string, GdaxChannel>;

  constructor(private _http: Http) {
    super();

    this.exchangeName = 'GDax';
    this._apiUrl = 'https://api-public.sandbox.gdax.com'; // 'https://api.gdax.com';
    this._wssUrl = 'wss://ws-feed-public.sandbox.gdax.com'; // find out
    this._products = [];

    if (this.initGDax()) {
    }

    console.log( 'instance ready');
  }

  /***/

  getAvailableSymbols( ): Observable<string[]> {
    if (this._products && this._products.length > 0) {
      return Observable.of( this._products.map( item => item.base_currency.toLowerCase( ) + item.quote_currency.toLowerCase( ) ));
    }

    console.log( 'GDax | getAvailableSymbols: ' + this._products.length + ' are currently available');

    return this._http.get( this._apiUrl + '/products' )
              .map( response => {
                let products: Product[] = [];
                response.json( ).forEach(element => {
                  let product: Product = Object.assign( new Product(), element );
                  console.log( 'product = ' + JSON.stringify(product));
                  products.push( product );
                });
                console.log( 'array => ' + products.length);
                return products;
              } )
              .map( products => products.map( item => item.base_currency.toLowerCase( ) + item.quote_currency.toLowerCase( ) ) );
  }

  getTrades( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'GDax | getTrades: ');
    let channel = new GdaxTradeChannel();
    channel.pair = symbol;
    channel.symbol = 't' + symbol;

    return channel.getSubscription( );
  }

  getTicker( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'GDax | getTicker: ');

    let tradeChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as GdaxTickerChannel) !== undefined ) as GdaxTickerChannel[];
    let channel = tradeChannels.find( item => item.symbol === symbol );

    if (!channel && this._queuedSubscriptions.has( 'ticker_' + symbol)) {
      channel = this._queuedSubscriptions.get( 'ticker_' + symbol) as GdaxTickerChannel;
    }

    if (!channel) {
      channel = new GdaxTickerChannel( );
      channel.pair = symbol;
      channel.symbol = symbol;

      this._queuedSubscriptions.set( 'ticker_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        this._socketConnection.send( channel.getSubscribeMessage( ) );
      }
    }

    return channel.getSubscription( );
  }

  getOrderBooks( symbol: string, options?: { prec: string, freq: string, length: string} ): IChannelSubscription {
    console.log( 'GDax | getOrderBooks: ');

    let channel = new GdaxBooksChannel();
    channel.pair = symbol;
    channel.symbol = 't' + symbol;

    return channel.getSubscription( );
  }

  getCandles( symbol: string, options?: {timeframe: string}): IChannelSubscription {
    console.log( 'GDax | getCandles: ');

    let channel = new GdaxCandleChannel();
    channel.pair = symbol;
    channel.symbol = 't' + symbol;

    return channel.getSubscription( );
  }

  unsubscribe( subscription: IChannelSubscription ): boolean {
    console.log( 'GDax | unsubscribe: ');
    return false;
  }

  /***/

  private initGDax( ): boolean {
    this._socketConnection = new WebSocket( this._wssUrl );
    this._socketConnection.onopen = this.onOpen.bind(this); // bind(this) preserves the this-context for the called method
    this._socketConnection.onerror = this.onError.bind(this);
    this._socketConnection.onclose = this.onClose.bind(this);
    this._socketConnection.onmessage = this.onMessage.bind(this);

    return true;
  }

  private onMessage(message: MessageEvent): any {
    console.log( 'GDax | onMessage: ' + JSON.stringify(message));

    let parsedMessage = JSON.parse(message.data);
    if (parsedMessage) {
      if (parsedMessage.hasOwnProperty('type')) {
        switch (parsedMessage.type) {
          case 'error': {
            console.log( '### ERROR: ' + JSON.stringify(parsedMessage) );
            break;
          }
          case 'subscriptions': {
            this.subscriptionReceived( parsedMessage );
            break;
          }
          case 'heartbeat': {
            this.onHeartbeatMessage( parsedMessage );
            break;
          }
          case 'ticker': {
            this.onTickerMessage( parsedMessage );
            break;
          }
          case 'snapshot': {
            this.onSnapshotMessage( parsedMessage );
            break;
          }
          case 'l2update': {
            this.onL2UpdateMessage( parsedMessage );
            break;
          }
          case 'activate':
          case 'margin_profile_update':
          case 'change':
          case 'match':
          case 'done':
          case 'open':
          case 'received': {
            console.log( '### KNOWN TYPE BUT NOT IMPLEMENTED: ' + JSON.stringify(parsedMessage));
            break;
          }
          default: {
            console.log( '### UNKNOWN MESSAGE TYPE: ' + JSON.stringify(parsedMessage) );
            break;
          }
        }
      } else {
        console.log( '### MESSAGE RECEIVED WITH NO TYPE: ' + JSON.stringify(parsedMessage));
      }
    }
  }

  private onOpen(event: Event) {
    console.log( 'GDax | onOpen: ' + JSON.stringify(event));
  }

  private onClose(event: CloseEvent): any {
    console.log( 'GDax | onClose: ' + JSON.stringify(event));
  }

  private onError(event: Event): any {
    console.log( 'GDax | onError: ' + JSON.stringify(event));
  }

  /***/

  private subscriptionReceived( parsedMessage: any ): void {
    console.log( '### SUBSCRIPTIONS: ' + JSON.stringify(parsedMessage) );

    // TODO: rework gdax subscription handling, because at the moment it is only a copy of the Bitfinex method

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
      let gdaxChannel = this._queuedSubscriptions.get(cacheKey) as GdaxChannel;
      gdaxChannel.channelName = parsedMessage.channel;
      gdaxChannel.channelIdentifier = parsedMessage.chanId;

      this._activeSubscriptions.set(gdaxChannel.channelName, gdaxChannel);
      this._queuedSubscriptions.delete(cacheKey);
    } else {
      console.log('GDax | No queued subscription found for currency-pair: ' + pair);
    }
  }


  private onHeartbeatMessage( parsedMessage: any ): void {
    console.log( 'GDax | onHeartbeatMessage: ' + JSON.stringify(event));
  }

  private onTickerMessage( parsedMessage: any ): void {
    console.log( 'GDax | onTickerMessage: ' + JSON.stringify(event));
  }

  private onSnapshotMessage( parsedMessage: any ): void {
    console.log( 'GDax | onSnapshotMessage: ' + JSON.stringify(event));
  }

  private onL2UpdateMessage( parsedMessage: any ): void {
    console.log( 'GDax | onL2UpdateMessage: ' + JSON.stringify(event));
  }
}
