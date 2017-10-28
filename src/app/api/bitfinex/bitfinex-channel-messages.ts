export class BitfinexChannelMessage {
  channelId: number;
  messageType?: string;

  constructor( ) {
  }
}

export class TradeMessage extends BitfinexChannelMessage {
  tradeId: number;
  timestamp: Date;

  private _amount: number;
  set amount(value) {
    this._amount = Math.abs(value);
    if (value >= 0) {
      this.orderType = 'BUY';
    } else {
      this.orderType = 'SELL';
    }
  }
  get amount() {
    return this._amount;
  }

  orderType: string;
  orderPrice: number;

  constructor( ) {
    super();
  }
}

export class CandleMessage extends BitfinexChannelMessage {
}

export enum OrderBookAction {
  UpdateBid,
  UpdateAsk,
  DeleteBid,
  DeleteAsk
}

export class BookMessage extends BitfinexChannelMessage {
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
}

export class TickerMessage extends BitfinexChannelMessage {
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
