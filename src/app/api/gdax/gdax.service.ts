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
import { IAssetPair } from 'app/shared/exchange-handler/interfaces/asset-pair';
import { GdaxAssetPair } from 'app/api/gdax/models/gdax-asset-pair';
import { ApiRequestQueue } from 'app/shared/api-request-queue/api-request-queue';

@Injectable()
export class GdaxService extends ExchangeService {
  readonly exchangeName: string;
  private _wssUrl: string;
  private _apiUrl: string;
  private _socketConnection: WebSocket;
  private _products: Product[];

  private _activeSubscriptions: Map<string, GdaxChannel>;
  private _queuedSubscriptions: Map<string, GdaxChannel>;
  private _apiRequestQueue: ApiRequestQueue;

  constructor(private _http: Http) {
    super();

    this.exchangeName = 'GDax';
    this._apiUrl = 'https://api.gdax.com'; // 'https://api-public.sandbox.gdax.com'; // 'https://api.gdax.com';
    this._wssUrl = 'wss://ws-feed.gdax.com'; // 'wss://ws-feed-public.sandbox.gdax.com'; // 'wss://ws-feed.gdax.com'
    this._products = [];
    this._activeSubscriptions = new Map<string, GdaxChannel>( );
    this._queuedSubscriptions = new Map<string, GdaxChannel>( );

    let apiQueueOptions = {
      maxRequestPerSecond: 3,
      hasBurstMode: true,
      maxRequestPerSecondInBurstMode: 6
    };

    this._apiRequestQueue = new ApiRequestQueue( this._http, apiQueueOptions );

    if (this.initGDax()) {
    }

    console.log( 'instance ready');
  }

  /***/

  getAvailableSymbols( ): Observable<IAssetPair[]> {
    if (this._products && this._products.length > 0) {
      return Observable.of( this._products.map( item => new GdaxAssetPair( item ) ) );
    }

    return this._http.get( this._apiUrl + '/products' )
              .map( response => {
                let products: Product[] = [];
                response.json( ).forEach(element => {
                  let product: Product = Object.assign( new Product(), element );
                  // console.log( 'product = ' + JSON.stringify(product));
                  products.push( product );
                });
                console.log( 'GDax | getAvailableSymbols: ' + products.length + ' are currently available');
                return products;
              } )
              // .map( products => products.map( item => item.base_currency.toLowerCase( ) + item.quote_currency.toLowerCase( ) ) );
              .map( products => products.map( item => new GdaxAssetPair( item ) ) );
  }

  getTrades( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'GDax | getTrades: ');
    let channel = new GdaxTradeChannel();
    channel.pair = symbol;
    channel.symbol = 't' + symbol;

    return channel.getSubscription( );
  }

  getTicker( symbol: string, options?: any ): IChannelSubscription {
    console.log( 'GDax | getTicker: symbol = ' + symbol);

    let tradeChannels = Array.from( this._activeSubscriptions.values( ) ).filter( item => (item as GdaxTickerChannel) !== undefined ) as GdaxTickerChannel[];
    let channel = tradeChannels.find( item => item.symbol === symbol );

    if (!channel && this._queuedSubscriptions.has( 'ticker_' + symbol)) {
      channel = this._queuedSubscriptions.get( 'ticker_' + symbol) as GdaxTickerChannel;
    }

    if (!channel) {
      channel = new GdaxTickerChannel( );
      channel.pair = symbol;
      channel.symbol = symbol;

      // create api request
      let relativeApiUrl = `/products/${symbol}/ticker`;
      let apiRequest = this._apiRequestQueue.request( this._apiUrl + relativeApiUrl );
      channel.requestItems.push( apiRequest );

      console.log( 'adding symbol \'' + symbol + '\' to queued subscriptions');
      this._queuedSubscriptions.set( 'ticker_' + channel.symbol, channel );

      if (this._socketConnection && this._socketConnection.readyState === 1 ) {
        console.log( 'subscribing to channel ');
        this._socketConnection.send( channel.getSubscribeMessage( ) );
        console.log( 'finished subscribing... ');
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

    parsedMessage.channels.forEach( channel => {
      let channelType = channel.name;

      channel.product_ids.forEach( product => {
        let cacheKey = channelType + '_' + product;

        if (this._queuedSubscriptions.has( cacheKey )) {
          let gdaxChannel = this._queuedSubscriptions.get(cacheKey) as GdaxChannel;
          gdaxChannel.channelName = channelType;
          gdaxChannel.channelIdentifier = cacheKey;

          this._activeSubscriptions.set(cacheKey, gdaxChannel);
          this._queuedSubscriptions.delete( cacheKey );

          console.log('GDax | found queued subscription for currency-pair: ' + product + ' -> switching to active subscription');
        } else if (this._activeSubscriptions.has( cacheKey )) {
          // console.log('GDax | found active subscriptn for currency-pair: ' + product + ' (ignoring it for the moment)' );
        } else {
          console.log('GDax | No queued subscription found for currency-pair: ' + product);
        }
      })
    });
  }

  private onHeartbeatMessage( parsedMessage: any ): void {
    console.log( 'GDax | onHeartbeatMessage: ' + JSON.stringify(parsedMessage));
  }

  private onTickerMessage( parsedMessage: any ): void {
    console.log( 'GDax | onTickerMessage: ' + JSON.stringify(parsedMessage));

    let channelIdentifier = parsedMessage.type + '_' + parsedMessage.product_id;
    if (this._activeSubscriptions.has(channelIdentifier)) {
      this._activeSubscriptions.get(channelIdentifier).sendMessage( parsedMessage );
    }
  }

  private onSnapshotMessage( parsedMessage: any ): void {
    console.log( 'GDax | onSnapshotMessage: ' + JSON.stringify(parsedMessage));
  }

  private onL2UpdateMessage( parsedMessage: any ): void {
    console.log( 'GDax | onL2UpdateMessage: ' + JSON.stringify(parsedMessage));
  }
}
