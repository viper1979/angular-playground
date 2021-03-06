import { Injectable } from '@angular/core';
import { IExchangeService } from 'app/shared/exchange-handler/interfaces/exchange-service';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';

@Injectable()
export abstract class ExchangeService implements IExchangeService {
  exchangeName: string;
  abstract getAvailableSymbols(): string[];
  abstract getTrades(symbol: string, options?: any): IChannelSubscription;
  abstract getTicker(symbol: string, options?: any): IChannelSubscription;
  abstract getOrderBooks(symbol: string, options?: any): IChannelSubscription;
  abstract getCandles(symbol: string, options?: any): IChannelSubscription;
  abstract unsubscribe(subscription: IChannelSubscription): boolean;
}
