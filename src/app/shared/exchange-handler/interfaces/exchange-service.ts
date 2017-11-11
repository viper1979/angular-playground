import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';

export interface IExchangeService {
  readonly exchangeName: string;

  getAvailableSymbols( ): string[];

  getTrades( symbol: string, options?: any ): IChannelSubscription;
  getTicker( symbol: string, options?: any ): IChannelSubscription;
  getOrderBooks( symbol: string, options?: any ): IChannelSubscription;
  getCandles( symbol: string, options?: any ): IChannelSubscription;

  unsubscribe( subscription: IChannelSubscription ): boolean;
}
