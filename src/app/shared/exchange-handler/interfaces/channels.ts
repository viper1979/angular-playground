import { EventEmitter } from '@angular/core';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';

export interface IChannel {
  channelIdentifier: any;
  channelName: string;
  heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;

  getSubscribeMessage( options?: any ): string;
  getUnsubscribeMessage( );
  getSubscription( ): IChannelSubscription;
  sendMessage( parsedMessage: any ): void;
  sendHeartbeat(): void;
}
