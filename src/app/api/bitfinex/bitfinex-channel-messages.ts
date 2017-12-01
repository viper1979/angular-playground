import {
  IChannelMessage,
  ITradeMessage,
  OrderType,
  ICandleMessage,
  ICandleSnapshotMessage,
  OrderBookAction,
  IOrderbookMessage,
  ITickerMessage,
  ITradeSnapshotMessage
} from 'app/shared/exchange-handler/interfaces/channel-messages';

export class BitfinexChannelMessage implements IChannelMessage {
  channelIdentifier: number;
  messageType?: string;
  isSnapshot: boolean;

  constructor( ) {
    this.isSnapshot = false;
  }
}

export class BitfinexTradeMessage extends BitfinexChannelMessage implements ITradeMessage {
  tradeId: number;
  timestamp: Date;

  private _amount: number;
  set amount(value) {
    this._amount = Math.abs(value);
    if (value >= 0) {
      this.orderType = OrderType.BuyOrder;
    } else {
      this.orderType = OrderType.SellOrder;
    }
  }
  get amount() {
    return this._amount;
  }

  orderType: OrderType;
  orderPrice: number;

  constructor( ) {
    super();
  }
}

export class BitfinexTradeSnapshotMessage extends BitfinexChannelMessage implements ITradeSnapshotMessage {
  messages: BitfinexTradeMessage[];

  constructor( ) {
    super( );
    this.messages = [];
    this.isSnapshot = true;
  }
}

export class BitfinexCandleMessage extends BitfinexChannelMessage implements ICandleMessage {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  constructor() {
    super();
  }
}

export class BitfinexCandleSnapshotMessage extends BitfinexChannelMessage implements ICandleSnapshotMessage {
  messages: BitfinexCandleMessage[];

  constructor () {
    super();
    this.messages = [];
    this.isSnapshot = true;
  }
}

export class BitfinexOrderbookMessage extends BitfinexChannelMessage implements IOrderbookMessage {
  price: number;
  rate: number;
  period: number;
  count: number;

  private _amount: number;
  set amount(value: number) {
    this._amount = value;
  }
  get amount(): number {
    return Math.abs(this._amount);
  }

  get action(): OrderBookAction {
    if (this.count > 0) {
      if (this._amount > 0) {
        return OrderBookAction.UpdateBid;
      } else if (this._amount < 0) {
        return OrderBookAction.UpdateAsk;
      }
    } else {
      if (this._amount === 1) {
        return OrderBookAction.DeleteBid;
      } else if (this._amount === -1) {
        return OrderBookAction.DeleteAsk;
      }
    }
  }

  // display variable
  levelAmount: number;
}

export class BitfinexTickerMessage extends BitfinexChannelMessage implements ITickerMessage {
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

  source: any;

  constructor() {
    super();
  }
}
