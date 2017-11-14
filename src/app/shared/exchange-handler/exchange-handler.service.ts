import { Injectable } from '@angular/core';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';

@Injectable()
export class ExchangeHandlerService {
  private _exchanges: Map<string, ExchangeService>;

  constructor() {
    this._exchanges = new Map<string, ExchangeService>( );
    this.registerAllExchanges( );
  }

  private registerAllExchanges( ): void {
    this._exchanges.set( 'Bitfinex', new BitfinexService( ) );
  }

  public getAvailableExchanges( ): string[] {
    return Array.from(this._exchanges.keys());
  }

  public getExchange( exchangeIdentifier: string ): ExchangeService {
    if (this._exchanges.has(exchangeIdentifier)) {
      return this._exchanges.get(exchangeIdentifier);
    }
    return null;
  }
}
