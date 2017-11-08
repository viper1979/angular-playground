import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AssetPair } from 'app/exchange-overview/exchange-overview.component';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { TickerMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exchange-asset-pair',
  templateUrl: './exchange-asset-pair.component.html',
  styleUrls: ['./exchange-asset-pair.component.css'],
  animations: [
    trigger('priceChangeState', [
      transition('* => higher', [
        style({
          backgroundColor: '#27f75b'
        }),
        animate('1500ms linear')
      ]),
      transition('* => lower', [
        style({
          backgroundColor: '#ff0000'
        }),
        animate('1500ms linear')
      ]),
      transition('* => equal', [
        style({
          backgroundColor: '#afb6ff'
        }),
        animate('1500ms linear')
      ])
    ])
  ]
})
export class ExchangeAssetPairComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  assetPair: AssetPair;

  @Input( )
  primaryPair: boolean;

  private _bitfinexChannelSubscription: BitfinexChannelSubscription;

  priceChangeState: string = 'equal';

  constructor(
    private _bitfinexService: BitfinexService,
    private _router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this._bitfinexChannelSubscription = this._bitfinexService.getTickerListener( this.assetPair.symbol );
    this._bitfinexChannelSubscription.listener.subscribe(
      next => {
        let tickerMessage: TickerMessage = next as TickerMessage;

        if (this.assetPair && this.assetPair.tickerMessage) {
          if (this.assetPair.tickerMessage.lastPrice < tickerMessage.lastPrice) {
            this.priceChangeState = 'higher';
          } else if (this.assetPair.tickerMessage.lastPrice > tickerMessage.lastPrice) {
            this.priceChangeState = 'lower';
          } else {
            this.priceChangeState = 'equal';
          }
        }

        this.assetPair.tickerMessage = next as TickerMessage;
      },
      error => console.log( 'error' ),
      () => console.log( 'completed' )
    );
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngOnDestroy() {
    if (this._bitfinexChannelSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexChannelSubscription);
    }
  }

  navigateToPair() {
    console.log( 'navigateToPair: ' + this.assetPair.symbol);
    this._router.navigate(['/bitfinex/' + this.assetPair.symbol]);
  }
}
