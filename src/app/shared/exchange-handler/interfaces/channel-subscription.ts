import { Observable } from 'rxjs/Observable';
import { IChannelMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';
import { EventEmitter } from '@angular/core';

export interface IChannelSubscription {
  channelIdentifier: any;
  channelName: string;
  symbol: string;
  listener: Observable<IChannelMessage>;
  heartbeat: EventEmitter<{channelName: string, timestamp: Date}>;
}
