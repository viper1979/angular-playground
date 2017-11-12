import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Rx';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ExchangeService } from 'app/shared/exchange-handler/exchange.service';
import { AutoCompleteModule } from 'primeng/primeng';
import 'rxjs/Rx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  exchangeName: string;
  bitfinexSymbol: string = 'BTCUSD';
  filteredSymbols: string[] = [];

  constructor(
    private _http: Http,
    private _exchangeService: ExchangeService) {
  }

  ngOnInit( ) {
    this.exchangeName = this._exchangeService.exchangeName;
    this.filteredSymbols = this._exchangeService.getAvailableSymbols();
  }

  filterSymbols(event) {
    if (!this.bitfinexSymbol || this.bitfinexSymbol.length === 0 ) {
      this.filteredSymbols = this._exchangeService.getAvailableSymbols( );
    }

    this.filteredSymbols = this._exchangeService.getAvailableSymbols( ).filter( item => {
      if (item.toUpperCase().indexOf( this.bitfinexSymbol.toUpperCase( ) ) >= 0 ) {
        return true;
      }
      return false;
    })
  }

  changeDisplaySymbol(event) {
    console.log('changeDisplaySymbol | symbol: ' + event);
  }
}
