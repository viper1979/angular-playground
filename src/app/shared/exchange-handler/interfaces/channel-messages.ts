export interface ExportSymbol {
  symbolIdentifier: string;
}

export interface IChannelMessage {
  channelIdentifier: any;
  messageType?: string;
  isSnapshot: boolean;
}

/***/

export interface ITradeMessage extends IChannelMessage {
  tradeId: number;
  timestamp: Date;
  orderPrice: number;
  orderType: OrderType;
  amount: number;
}

export interface ITradeSnapshotMessage extends IChannelMessage {
  messages: ITradeMessage[];
}

export enum OrderType {
  BuyOrder,
  SellOrder
}

/***/

export interface ICandleMessage extends IChannelMessage {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ICandleSnapshotMessage extends IChannelMessage {
  messages: ICandleMessage[];
}

/***/

export interface IOrderbookMessage extends IChannelMessage {
  price: number;
  rate: number;
  period: number;
  count: number;
  amount: number;
  action: OrderBookAction;

  levelAmount: number;
}

export enum OrderBookAction {
  UpdateBid,
  UpdateAsk,
  DeleteBid,
  DeleteAsk
}

/***/

export interface ITickerMessage extends IChannelMessage {
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
}

export interface ITickerSnapshotMessage extends IChannelMessage {
  messages: ITickerMessage[];
}
