import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
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

  @Input( )
  finalSorting: boolean;

  @ViewChild('chart24h')
  chart: UIChart;

  private _bitfinexChannelSubscription: BitfinexChannelSubscription;
  private _bitfinexChartSubscription: BitfinexChannelSubscription;
  // private _chartData: Map<string, CandleMessage>;
  private _chartData: CandleMessage[];

  priceChangeState: string = 'equal';
  chartData: PrimeNgChartData;
  chartOptions: any;

  constructor(
    private _bitfinexService: BitfinexService,
    private _changeDetector: ChangeDetectorRef,
    private _router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this._chartData = [];
    this.chartData = new PrimeNgChartData( );

    this.chartOptions = this.getChartOptions( );

    this._bitfinexChannelSubscription = this._bitfinexService.getTickerListener( this.assetPair.symbol );
    this._bitfinexChannelSubscription.listener.subscribe(
      next => {
        let tickerMessage: TickerMessage = next as TickerMessage;

        this.priceChangeState = 'equal';

        if (this.assetPair && this.assetPair.tickerMessage) {
          if (this.assetPair.tickerMessage.lastPrice < tickerMessage.lastPrice) {
            this._changeDetector.detectChanges( );
            this.priceChangeState = 'higher';
          } else if (this.assetPair.tickerMessage.lastPrice > tickerMessage.lastPrice) {
            this._changeDetector.detectChanges( );
            this.priceChangeState = 'lower';
          } else {
            this.priceChangeState = 'equal';
          }
        }

        this.assetPair.tickerMessage = tickerMessage;
      },
      error => console.log( 'error' ),
      () => console.log( 'completed' )
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.primaryPair && this.finalSorting ) {
      this._bitfinexChartSubscription = this._bitfinexService.getCandleListener( this.assetPair.symbol, {timeframe: '15m'} );
      this._bitfinexChartSubscription.listener.subscribe(
        next => {
          let candleMessage: CandleMessage | CandleSnapshotMessage;

          if (next.isSnapshotMessage) {
            candleMessage = next as CandleSnapshotMessage;

            this._chartData = candleMessage.messages.sort( (d1, d2) => d1.timestamp.getTime( ) - d2.timestamp.getTime( ) ).slice( candleMessage.messages.length - 96);
          } else {
            candleMessage = next as CandleMessage;
            let timestamp = candleMessage.timestamp;

            let indexToReplace = this._chartData.findIndex( item => item.timestamp.getTime( ) === timestamp.getTime( ) );

            if (indexToReplace >= 0) {
              this._chartData[indexToReplace] = candleMessage;
            } else {
              this._chartData.splice( 0, 1 );
              this._chartData.push( candleMessage );
            }
          }

          let formatter = (timestamp: Date): string => {
            let minutes = timestamp.getMinutes( ) < 10 ? '0' + timestamp.getMinutes( ) : timestamp.getMinutes( );
            return timestamp.getDate() + '.' + timestamp.getMonth( ) + '. | ' + timestamp.getHours( ) + ':' + minutes + ' Uhr';
          };

          this.chartData.labels = [];
          this.chartData.labels = this._chartData.map( item => formatter( item.timestamp ) );
          this.chartData.datasets[0].data = this._chartData.map( item => item.close );
          this.chartData.datasets[0].label = this.assetPair.symbol;

          if (this.chart) {
            this.chart.refresh( );
          } else {
            // TODO: when primary pair changes we have an undefined chart!!
            console.log( 'chart undefined for pair: ' + this.assetPair.symbol );
          }
        }
      );
    }
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

  private getChartOptions( ): any {
    return {
      title: { display: false },
      legend: { display: false },
      scales: {
        yAxes: [{
          display: false,
          ticks: { display: false }
        }],
        xAxes: [{
          display: false,
          ticks: { display: false }
        }]
      },
      elements: {
        line: {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderColor: 'rgba(0,200,0,0.5)',
          fill: true,
        },
        point: {
          radius: 1,
          hitRadius: 5,
          hoverRadius: 10,
          pointStyle: 'cross'
        }
      }
    };
  }
}

enum PriceChangeState {
  Neutral,
  Rising,
  Falling
}
