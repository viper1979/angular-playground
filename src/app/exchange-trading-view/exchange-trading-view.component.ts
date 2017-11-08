import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exchange-trading-view',
  templateUrl: './exchange-trading-view.component.html',
  styleUrls: ['./exchange-trading-view.component.css']
})
export class ExchangeTradingViewComponent implements OnInit {
  @Input( )
  bitfinexSymbol: string;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        console.log( 'route parameter received: ' + JSON.stringify(params));
        this.bitfinexSymbol = params['bitfinexSymbol'];
      }
    );
  }

}
