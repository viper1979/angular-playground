import {
  IChannelMessage,
  ITradeMessage,
  OrderType,
  ICandleMessage,
  ICandleSnapshotMessage,
  OrderBookAction,
  IOrderbookMessage,
  ITickerMessage,
  ITradeSnapshotMessage,
  ITickerSnapshotMessage
} from 'app/shared/exchange-handler/interfaces/channel-messages';

export class GdaxChannelMessage {
  channelIdentifier: any;
  messageType?: string;
  isSnapshot: boolean;

  constructor( ) {
    this.isSnapshot = false;
  }
}

export class GdaxTickerMessage extends GdaxChannelMessage implements ITickerMessage {
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  dailyChange: number;
  dailyChangePercent: number;
  lastPrice: number;
  volume: number;
  high: number;
  low: number;

  constructor() {
    super();
  }
}

export class GdaxTickerSnapshotMessage extends GdaxChannelMessage implements ITickerSnapshotMessage {
  messages: GdaxTickerMessage[];

  constructor () {
    super();
    this.messages = [];
    this.isSnapshot = true;
  }
}
