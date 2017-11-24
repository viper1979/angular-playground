import { IAssetPair } from 'app/shared/exchange-handler/interfaces/asset-pair';
import { ITickerMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

export class BitfinexAssetPair implements IAssetPair {
  exchange: string;
  exchangeSymbol: string;
  displaySymbol: string;
  fromCurrency: string;
  toCurrency: string;
  minSize: number;
  maxSize: number;
  tickerMessage: ITickerMessage;

  constructor( assetPair: string ) {
    this.assignValues( assetPair );
  }

  private assignValues( assetPair: string ): void {
    this.exchange = 'Bitfinex';
    this.exchangeSymbol = assetPair;
    this.fromCurrency = assetPair.substr( 0, 3 );
    this.toCurrency = assetPair.substr( 3 );

    this.displaySymbol = this.fromCurrency.toUpperCase( ) + this.toCurrency.toUpperCase( );
  }
}
