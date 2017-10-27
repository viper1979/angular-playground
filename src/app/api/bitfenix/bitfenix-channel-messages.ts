export class BitfenixChannelInfo {
  channelId: number;
  channel: string;
}

export class BitfenixChannelMessage {
  channelId: number;
  messageType?: string;

  public static create( parsedMessage: any ): BitfenixChannelMessage {
    let messageType = parsedMessage[1];

    switch (messageType) {
      case 'tu':
      case 'te': {
        let tradeMessage = new TradeMessage( );
        tradeMessage.channelId = parsedMessage[0];
        tradeMessage.messageType = parsedMessage[1];
        tradeMessage.tradeId = parsedMessage[2][0];
        tradeMessage.timestamp = new Date(parsedMessage[2][1]);
        tradeMessage.amount = parsedMessage[2][2];
        tradeMessage.orderPrice = parsedMessage[2][3];

        return tradeMessage;
      }
      default: {
        // console.log( 'messageType not implemented: ' + parsedMessage);
        return new BitfenixChannelMessage( );
      }
    }
  }

  constructor( ) {
  }
}

export class TradeMessage extends BitfenixChannelMessage {
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

export class CandleMessage extends BitfenixChannelMessage {
}

export class BookMessage extends BitfenixChannelMessage {
  price: number;
  rate: number;
  period: number;
  count: number;
  amount: number;

  getOrderType( ): string {
    if (this.count > 0) {
      if (this.amount > 0) {
        return 'UPDATE_BID';
      } else if (this.amount < 0) {
        return 'UPDATE_ASK'
      }
    } else {
      if (this.amount === 1) {
        return 'DELETE_BID';
      } else if (this.amount === -1) {
        return 'DELETE_ASK';
      }
    }
  }
}

export class TickerMessage extends BitfenixChannelMessage {
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
