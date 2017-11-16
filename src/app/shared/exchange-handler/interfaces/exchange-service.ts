import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { Observable } from 'rxjs/Observable';

export interface IExchangeService {
  readonly exchangeName: string;

  getAvailableSymbols( ): Observable<string[]>;

  getTrades( symbol: string, options?: any ): IChannelSubscription;
  getTicker( symbol: string, options?: any ): IChannelSubscription;
  getOrderBooks( symbol: string, options?: any ): IChannelSubscription;
  getCandles( symbol: string, options?: any ): IChannelSubscription;

  unsubscribe( subscription: IChannelSubscription ): boolean;
}
