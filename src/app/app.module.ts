import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule, LOCALE_ID } from '@angular/core';
import { AppComponent } from './app.component';
import { QuoteComponent } from './quote/quote.component';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TickerComponent } from './ticker/ticker.component';
import { OrderbookComponent } from './orderbook/orderbook.component';

import { AutoCompleteModule, ChartModule } from 'primeng/primeng';
import { CurrencySymbolPipe } from 'app/shared/pipes/currencySymbol.pipe';
import { ChartComponent } from './chart/chart.component';

@NgModule({
  declarations: [
    AppComponent,
    QuoteComponent,
    TickerComponent,
    OrderbookComponent,

    CurrencySymbolPipe,

    ChartComponent
],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,

    AutoCompleteModule,
    ChartModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    BitfinexService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
