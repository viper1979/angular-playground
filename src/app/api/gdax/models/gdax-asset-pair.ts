import { IAssetPair } from 'app/shared/exchange-handler/interfaces/asset-pair';
import { ITickerMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

export class GdaxAssetPair implements IAssetPair {
  exchange: string;
  exchangeSymbol: string;
  displaySymbol: string;
  fromCurrency: string;
  toCurrency: string;
  minSize: number;
  maxSize: number;
  quoteIncrement: number;
  tickerMessage: ITickerMessage;

  constructor( assetPair: any ) {
    this.assignValues( assetPair );
  }

  private assignValues( assetPair: any ): void {
    this.exchange = 'GDax';

    if (assetPair) {
      this.exchangeSymbol = assetPair.id;
      this.fromCurrency = assetPair.base_currency;
      this.toCurrency = assetPair.quote_currency;
      this.minSize = parseFloat( assetPair.base_min_size );
      this.maxSize = parseFloat( assetPair.base_max_size );
      this.quoteIncrement = parseFloat( assetPair.quote_increment );

      this.displaySymbol = this.fromCurrency.toUpperCase( ) + this.toCurrency.toUpperCase( );
    }
  }
}
