import { Injectable } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { HttpClient } from 'selenium-webdriver/http';
import { Http } from '@angular/http';
import { Product } from 'app/api/gdax/models/product';
import { forEach } from '@angular/router/src/utils/collection';
import { Observable } from 'rxjs/Observable';
import { GdaxTradeChannel, GdaxTickerChannel, GdaxBooksChannel, GdaxCandleChannel } from 'app/api/gdax/gdax-channels';

@Injectable()
export class GdaxService extends ExchangeService {
  readonly exchangeName: string;
  private _wssUrl: string;
  private _apiUrl: string;
  private _socketConnection: WebSocket;
  private _products: Product[];

  constructor(private _http: Http) {
    super();

    this.exchangeName = 'GDax';
    this._apiUrl = 'https://api-public.sandbox.gdax.com'; // 'https://api.gdax.com';
    this._wssUrl = 'wss://ws-feed-public.sandbox.gdax.com'; // find out
    this._products = [];

    // if (this.initGDax()) {
    // }

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

    let channel = new GdaxTickerChannel( );
    channel.pair = symbol;
    channel.symbol = 't' + symbol;

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
}
