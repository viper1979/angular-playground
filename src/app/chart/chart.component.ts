import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, ViewChild } from '@angular/core';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { CandleMessage } from 'app/api/bitfinex/bitfinex-channel-messages';
import { BitfinexChannelSubscription } from 'app/api/bitfinex/bitfinex-channels';
import { UIChart } from 'primeng/primeng';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  private _bitfinexSubscription: BitfinexChannelSubscription;
  private _chartData: Map<string, CandleMessage>;

  @ViewChild('chart')
  chart: UIChart;

  @ViewChild('volumechart')
  volumeChart: UIChart;

  chartData: PrimeNgChartData;
  chartDataVolume: PrimeNgChartData;

  volumeChartOptions: any;

  @Input()
  symbol: string;

  constructor(private _bitfinexService: BitfinexService) {
  }

  ngOnInit() {
    this.chartData = new PrimeNgChartData( );
    this.chartDataVolume = new PrimeNgChartData( );

    this._chartData = new Map<string, CandleMessage>( );

    this.volumeChartOptions = {
      title: {
        display: false,
      },
      legend: {
        display: false
      }
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.symbol.currentValue.length === 6) {
      if (this._bitfinexSubscription) {
        this._bitfinexService.unsubscribe( this._bitfinexSubscription );
      }

      if (!this.chartData) {
        this.chartData = new PrimeNgChartData( );
        this.chartDataVolume = new PrimeNgChartData( );
      }
      this.chartData.datasets[0].label = this.symbol;
      this.chartDataVolume.datasets[0].label = 'volume';

      console.log( 'ChartComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
      this._bitfinexSubscription = this._bitfinexService.getCandleListener( this.symbol );

      this._bitfinexSubscription.heartbeat.subscribe(
        hb => console.log( 'ChartComponent | Channel \'' + hb.channel + '\' heartbeat @ ' + hb.timestamp )
      );

      this._bitfinexSubscription.listener.subscribe(
        next => {
          let candleMessage: CandleMessage = next as CandleMessage;

          this._chartData.set(candleMessage.timestamp.toString( ), candleMessage);
          if (this._chartData.size > 20) {
            let firstKey = Array.from( this._chartData.keys( ) ).sort( (d1, d2) => this.DateComparer( d1, d2) )[0];
            this._chartData.delete(firstKey);
          }

          this.chartData.labels = [];
          this.chartData.datasets[0].data = [];
          this.chartData.datasets[0].label = this.symbol;

          this.chartDataVolume.labels = [];
          this.chartDataVolume.datasets[0].data = [];
          this.chartDataVolume.datasets[0].label = this.symbol;

          Array.from( this._chartData.keys( ) ).sort( (d1, d2) => this.DateComparer( d1, d2) ).forEach(element => {
            let candle = this._chartData.get(element);

            let displayTimestamp = ( candle.timestamp.getHours() < 10 ? '0' + candle.timestamp.getHours( ) : candle.timestamp.getHours( ) ) + ':';
            displayTimestamp += candle.timestamp.getMinutes() < 10 ? '0' + candle.timestamp.getMinutes( ) : candle.timestamp.getMinutes( );

            this.chartData.labels.push( displayTimestamp );
            this.chartData.datasets[0].data.push( this._chartData.get(element).close );

            this.chartDataVolume.labels.push( displayTimestamp );
            this.chartDataVolume.datasets[0].data.push( this._chartData.get(element).volume );
          });
          this.chart.refresh( );
          this.volumeChart.refresh( );

          console.log( 'ChartComponent | ngOnChanges | message: ' + JSON.stringify(candleMessage) );
        },
        error => console.log( 'ChartComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
        () => console.log( 'ChartComponent | ngOnChanges | completed' )
      );
    }
  }

  ngOnDestroy() {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexSubscription);
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

export class PrimeNgChartData {
  labels: string[] = [];
  datasets: PrimeNgDataset[] = [];

  constructor( ) {
    this.datasets.push( new PrimeNgDataset( ) );
  }
}

export class PrimeNgDataset {
  label: string;
  data: number[] = [];

  constructor( ) {
    this.label = '';
  }
}
