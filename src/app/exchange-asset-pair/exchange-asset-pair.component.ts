import { Component, OnInit, OnChanges, OnDestroy, Input, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AssetPair } from 'app/exchange-overview/exchange-overview.component';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UIChart } from 'primeng/primeng';
import { PrimeNgChartData } from 'app/chart/chart.component';
import { IChannelSubscription } from 'app/shared/exchange-handler/interfaces/channel-subscription';
import { ICandleMessage, ITickerMessage, ICandleSnapshotMessage } from 'app/shared/exchange-handler/interfaces/channel-messages';

@Component({
  selector: 'app-exchange-asset-pair',
  templateUrl: './exchange-asset-pair.component.html',
  styleUrls: ['./exchange-asset-pair.component.css'],
  animations: [
    trigger('priceChangeState', [
      transition('* => higher', [
        style({
          backgroundColor: '#00bb00',
          color: '#00ff00'
        }),
        animate('1500ms linear')
      ]),
      transition('* => lower', [
        style({
          backgroundColor: '#bb0000',
          color: '#ff0000'
        }),
        animate('1500ms linear')
      ]),
      // transition('* => equal', [
      //   style({
      //     backgroundColor: '#afb6ff'
      //   }),
      //   animate('1500ms linear')
      // ])
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

  private _tickerSubscription: IChannelSubscription;
  private _chartSubscription: IChannelSubscription;
  // private _chartData: Map<string, CandleMessage>;
  private _chartData: ICandleMessage[];

  priceChangeState: string = 'equal';
  chartData: PrimeNgChartData;
  chartOptions: any;
  showChart: boolean = false;

  constructor(
    private _exchangeService: ExchangeService,
    private _changeDetector: ChangeDetectorRef,
    private _router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this._chartData = [];
    this.chartData = new PrimeNgChartData( );

    this.chartOptions = this.getChartOptions( );

    this._tickerSubscription = this._exchangeService.getTicker( this.assetPair.symbol );
    this._tickerSubscription.listener.subscribe(
      next => {
        let tickerMessage: ITickerMessage = next as ITickerMessage;

        this.priceChangeState = 'equal';

        if (this.assetPair && this.assetPair.tickerMessage) {
          if (this.assetPair.tickerMessage.lastPrice < tickerMessage.lastPrice) {
            // https://stackoverflow.com/questions/37849453/attempt-to-use-a-destroyed-view-detectchanges
            if (!this._changeDetector['destroyed']) {
              this._changeDetector.detectChanges();
            }
            this.priceChangeState = 'higher';
          } else if (this.assetPair.tickerMessage.lastPrice > tickerMessage.lastPrice) {
            if (!this._changeDetector['destroyed']) {
              this._changeDetector.detectChanges();
            }
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
    if (this.primaryPair && this.finalSorting && !this._chartSubscription ) {
      this._chartSubscription = this._exchangeService.getCandles( this.assetPair.symbol, {timeframe: '15m'} );
      this._chartSubscription.listener.subscribe(
        next => {
          let candleMessage: ICandleMessage | ICandleSnapshotMessage;

          if (next.isSnapshot) {
            candleMessage = next as ICandleSnapshotMessage;

            this._chartData = candleMessage.messages.sort( (d1, d2) => d1.timestamp.getTime( ) - d2.timestamp.getTime( ) ).slice( candleMessage.messages.length - 96);
          } else {
            candleMessage = next as ICandleMessage;
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
    // when a change-detector is used, we need to detach it from the component when it is destroyed
    this._changeDetector.detach( );

    if (this._tickerSubscription) {
      this._exchangeService.unsubscribe(this._tickerSubscription);
    }
    if (this._chartSubscription) {
      this._exchangeService.unsubscribe(this._chartSubscription);
    }
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
          backgroundColor: 'rgba(0,100,0,0.2)',
          borderColor: 'rgba(0,200,0,1)',
          borderWidth: 1,
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
