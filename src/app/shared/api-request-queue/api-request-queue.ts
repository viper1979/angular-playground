import { Http } from '@angular/http/src/http';
import { Observable } from 'rxjs/Observable';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { CommonHelper } from 'app/shared/helper/common-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class ApiRequestQueue {
  private _maxRequestsPerSecond: number;
  private _maxRequestsPerSecondInBurstMode: number;
  private _hasBurstMode: boolean;
  private _burstModeEnabled: boolean;
  private _timerId: number;

  private _queue: RequestItem[];
  private _http: Http;

  constructor( http: Http, options?: { maxRequestPerSecond: number, hasBurstMode: boolean, maxRequestPerSecondInBurstMode: number } ) {
    this._http = http;
    this._queue = [];

    // init default values
    this._maxRequestsPerSecond = 3;
    this._maxRequestsPerSecondInBurstMode = 6;
    this._hasBurstMode = false;
    this._burstModeEnabled = true;

    if (options) {
      if (options.hasOwnProperty( 'maxRequestPerSecond')) {
        this._maxRequestsPerSecond = options.maxRequestPerSecond;
      }
      if (options.hasOwnProperty( 'hasBurstMode')) {
        this._hasBurstMode = options.hasBurstMode;
      }
      if (options.hasOwnProperty( 'maxRequestPerSecondInBurstMode')) {
        this._maxRequestsPerSecondInBurstMode = options.maxRequestPerSecondInBurstMode;
      }
    }

    if (!this._timerId) {
      this._timerId = window.setInterval(() => this.performRequests( ), 1000);
    }
  }

  request( url: string, options?: any ): RequestItem { // Observable<Response>
    let requestToQueue = new RequestItem( url, options );

    console.log( 'request queued: ' + requestToQueue.requestId )
    this._queue.push( requestToQueue );

    return requestToQueue;
  }

  /***/

  private performRequests( ) {
    if (this._queue && this._queue.length > 0) {
      let requestsToPerform: RequestItem[] = [];

      // determine the number of requests allowed
      let numberOfRequestsToPerform: number = this.getNumberOfRequestsAllowed( );
      for (let i = 0; i < numberOfRequestsToPerform; i++) {
        if (this._queue.length > 0) {
          let requestToPerform = this._queue.shift( );
          requestsToPerform.push( requestToPerform );
        }
      }

      console.log( 'BATCH REQUEST | items.length: ' + requestsToPerform.length + ' queue.length: ' + this._queue.length );

      // perform a request for all queued requests in this request timeframe
      requestsToPerform.forEach( item => {
        console.log( 'requesting \'' + item.requestId + '\'... ');
        this._http.get( item.requestUrl, item.options ).subscribe(
          response => {
            console.log( 'response \'' + item.requestId + '\' received' );
            item.response.result = response;
          },
          error => item.response.result = 'error',
          ( ) => console.log( 'request \'' + item.requestId + '\' completed' )
        );
      });
    }
  }

  private getNumberOfRequestsAllowed( ): number {
    let numberOfRequestsToPerform: number = this._maxRequestsPerSecond;
    if (this._hasBurstMode && this._burstModeEnabled) {
      console.log( 'ApiRequestQueue | BurstMode active | raising request count from ' + this._maxRequestsPerSecond + ' to ' + this._maxRequestsPerSecondInBurstMode );
      numberOfRequestsToPerform = this._maxRequestsPerSecondInBurstMode;

      // only allow burst mode as first request
      this._burstModeEnabled = false;
    }
    return numberOfRequestsToPerform;
  }
}

export class RequestItem {
  readonly requestId: string;
  readonly requestUrl: string;
  readonly options?: RequestOptionsArgs;
  readonly response: ResponseItem;

  constructor( requestUrl: string, options?: RequestOptionsArgs ) {
    this.requestId = CommonHelper.generateUuid( );
    this.requestUrl = requestUrl;
    this.options = options;

    this.response = new ResponseItem( );
  }
}

export class ResponseItem {
  private readonly _listener: BehaviorSubject<any>;

  set result( value: any ) {
    this._listener.next( value );
  }

  resultAvailable: boolean;

  constructor( ) {
    this._listener = new BehaviorSubject<any>( null );
  }

  getListener( ): Observable<any> {
    return this._listener.filter( item => item !== null );
  }
}
