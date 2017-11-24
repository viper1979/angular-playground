import { ITickerMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

export interface IAssetPair {
  exchange: string;
  exchangeSymbol: string;
  displaySymbol: string;
  fromCurrency: string;
  toCurrency: string;
  minSize: number;
  maxSize: number;

  tickerMessage: ITickerMessage;
}
