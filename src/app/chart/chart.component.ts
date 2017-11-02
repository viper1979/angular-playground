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

  @Input()
  symbol: string;

  chartData: PrimeNgChartData;
  chartDataVolume: PrimeNgChartData;
  volumeChartOptions: any;

  selectedTimeframe: string = '1m';
  availableTimeframes: any[];

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

    this.availableTimeframes = [
      {label: 'one minute', value: '1m'},
      {label: 'five minutes', value: '5m'},
      {label: '15 minutes', value: '15m'},
      {label: '30 minutes', value: '30m'},
      {label: 'one hour', value: '1h'},
      {label: '3 hours', value: '3h'},
      {label: '6 hours', value: '6h'},
      {label: '12 hours', value: '12h'},
      {label: 'one day', value: '1D'},
      {label: 'one week', value: '7D'},
      {label: 'two weeks', value: '14D'},
      {label: 'one month', value: '1M'}
    ];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.symbol.currentValue.length === 6) {
      this.drawChart( );
    }
  }

  ngOnDestroy() {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe(this._bitfinexSubscription);
    }
  }

  private drawChart( ) {
    if (this._bitfinexSubscription) {
      this._bitfinexService.unsubscribe( this._bitfinexSubscription );
    }

    // reset variables
    this._chartData = new Map<string, CandleMessage>( );
    this.chartData = new PrimeNgChartData( );
    this.chartDataVolume = new PrimeNgChartData( );
    this.chartData.datasets[0].label = this.symbol;
    this.chartDataVolume.datasets[0].label = 'volume';

    console.log( 'ChartComponent | ngOnChanges | Trying to subscribe to symbol: ' + this.symbol);
    this._bitfinexSubscription = this._bitfinexService.getCandleListener( this.symbol, {timeframe: this.selectedTimeframe} );

    this._bitfinexSubscription.heartbeat.subscribe(
      hb => console.log( 'ChartComponent | Channel \'' + hb.channel + '\' heartbeat @ ' + hb.timestamp )
    );

    this._bitfinexSubscription.listener.subscribe(
      next => {
        let candleMessage: CandleMessage = next as CandleMessage;

        this._chartData.set(candleMessage.timestamp.toString( ), candleMessage);
        if (this._chartData.size > 200) {
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

          // let displayTimestamp = ( candle.timestamp.getHours() < 10 ? '0' + candle.timestamp.getHours( ) : candle.timestamp.getHours( ) ) + ':';
          // displayTimestamp += candle.timestamp.getMinutes() < 10 ? '0' + candle.timestamp.getMinutes( ) : candle.timestamp.getMinutes( );

          let displayTimestamp = this.GetDisplayTimestamp( candle.timestamp );

          this.chartData.labels.push( displayTimestamp );
          this.chartData.datasets[0].data.push( this._chartData.get(element).close );

          this.chartDataVolume.labels.push( displayTimestamp );
          this.chartDataVolume.datasets[0].data.push( this._chartData.get(element).volume );
        });
        this.chart.refresh( );
        this.volumeChart.refresh( );

        // console.log( 'ChartComponent | ngOnChanges | message: ' + JSON.stringify(candleMessage) );
      },
      error => console.log( 'ChartComponent | ngOnChanges | error: ' + JSON.stringify(error) ),
      () => console.log( 'ChartComponent | ngOnChanges | completed' )
    );
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

  private GetDisplayTimestamp( timestamp: Date ): string {
    let sTimestamp: string;

    switch (this.selectedTimeframe) {
      case '1m':
      case '5m':
      case '15m':
      case '30m': {
        let hours: number = timestamp.getHours( );
        let minutes: number = timestamp.getMinutes( );
        sTimestamp = ( hours < 10 ? '0' : '' )  + hours + ':';
        sTimestamp += ( minutes < 10 ? '0' : '' ) + minutes;
        return sTimestamp;
      }
      case '1h':
      case '3h': {
        let hours: number = timestamp.getHours( );
        let day: number = timestamp.getDay( );
        sTimestamp = ( hours < 10 ? '0' : '' )  + hours + 'h ';
        sTimestamp += timestamp.getDay( ) + '.' + timestamp.getMonth( );
        return sTimestamp;
      }
      case '6h':
      case '12h':
      case '1D': {
        let day: number = timestamp.getDay( );
        sTimestamp = timestamp.getDay( ) + '/' + timestamp.getMonth( ) + '/' + timestamp.getFullYear( );
        return sTimestamp;
      }
      case '7D':
      case '14D':
      case '1M':
      default: {
        sTimestamp = timestamp.getMonth( ) + '/' + ( timestamp.getFullYear( ) );
        return sTimestamp;
      }
    }
  }

  timeframeChanged(event): void {
    this.selectedTimeframe = event;
    this.drawChart( );
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
