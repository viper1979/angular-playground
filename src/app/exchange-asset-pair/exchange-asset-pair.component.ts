import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, ViewChild } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AssetPair } from 'app/exchange-overview/exchange-overview.component';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { TickerMessage, CandleMessage, CandleSnapshotMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { Router, ActivatedRoute } from '@angular/router';
import { UIChart } from 'primeng/primeng';
import { PrimeNgChartData } from 'app/chart/chart.component';

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

  @ViewChild('chart24h')
  chart: UIChart;

  private _bitfinexChannelSubscription: BitfinexChannelSubscription;
  private _bitfinexChartSubscription: BitfinexChannelSubscription;
  private _chartData: Map<string, CandleMessage>;

  priceChangeState: string = 'equal';
  chartData: PrimeNgChartData;
  // chartData: any;
  chartOptions: any;

  constructor(
    private _bitfinexService: BitfinexService,
    private _router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this._chartData = new Map<string, CandleMessage>( );
    this.chartData = new PrimeNgChartData( );

    this.chartOptions = {
      title: {
        display: false,
      },
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          display: false,
          ticks: { display: false }
        }],
        xAxes: [{
          display: false,
          ticks: { display: false }
        }]
      }
    };

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

    this._bitfinexChartSubscription = this._bitfinexService.getCandleListener( this.assetPair.symbol, {timeframe: '15m'} );
    this._bitfinexChartSubscription.listener.subscribe(
      next => {
        let candleMessage: CandleMessage | CandleSnapshotMessage;
        if (next.isSnapshotMessage) {
          candleMessage = next as CandleSnapshotMessage;

          candleMessage.messages.forEach( cm => {
            this._chartData.set(cm.timestamp.toString( ), cm);
            if (this._chartData.size > 96) {
              let firstKey = Array.from( this._chartData.keys( ) ).sort( (d1, d2) => this.DateComparer( d1, d2) )[0];
              this._chartData.delete(firstKey);
            }
          });

        } else {
          candleMessage = next as CandleMessage;

          this._chartData.set(candleMessage.timestamp.toString( ), candleMessage);
          if (this._chartData.size > 96) {
            let firstKey = Array.from( this._chartData.keys( ) ).sort( (d1, d2) => this.DateComparer( d1, d2) )[0];
            this._chartData.delete(firstKey);
          }
        }

        this.chartData.labels = [];
        this.chartData.datasets[0].data = [];
        this.chartData.datasets[0].label = this.assetPair.symbol;

        Array.from( this._chartData.keys( ) ).sort( (d1, d2) => this.DateComparer( d1, d2) ).forEach(element => {
          let candle = this._chartData.get(element);

          let displayTimestamp = candle.timestamp.toLocaleDateString();
          this.chartData.labels.push( displayTimestamp );
          this.chartData.datasets[0].data.push( this._chartData.get(element).close );
        });

        if (this.chart) {
          this.chart.refresh( );
        }
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngOnDestroy() {
    if (this._bitfinexChannelSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexChannelSubscription);
    }
    if (this._bitfinexChartSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexChartSubscription);
    }
  }

  private DateComparer( date1: string, date2: string ): number {
    let dDate1 = new Date( date1 );
    let dDate2 = new Date( date2 );

    if (dDate1 > dDate2) {
      return 1;
    }
    if (dDate2 > dDate1) {
      return -1;
    }
    return 0;
  }
}
