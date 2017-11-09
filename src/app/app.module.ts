import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule, LOCALE_ID } from '@angular/core';

import { AppComponent } from './app.component';
import { TradesComponent } from './trades/trades.component';
import { BitfinexService } from 'app/api/bitfinex/bitfinex.service';
import { TickerComponent } from './ticker/ticker.component';
import { OrderbookComponent } from './orderbook/orderbook.component';

import { AutoCompleteModule, ChartModule } from 'primeng/primeng';
import { CurrencySymbolPipe } from 'app/shared/pipes/currencySymbol.pipe';
import { VolumePipe } from 'app/shared/pipes/volume.pipe';

import { ChartComponent } from './chart/chart.component';
import { ExchangeOverviewComponent } from './exchange-overview/exchange-overview.component';
import { ExchangeAssetPairComponent } from './exchange-asset-pair/exchange-asset-pair.component';
import { ExchangeAssetPairsComponent } from './exchange-asset-pairs/exchange-asset-pairs.component';
import { ExchangeTradingViewComponent } from './exchange-trading-view/exchange-trading-view.component';

const appRoutes: Routes = [
  { path: ':exchange/:bitfinexSymbol', component: ExchangeTradingViewComponent },
  { path: '**', component: ExchangeOverviewComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    TradesComponent,
    TickerComponent,
    OrderbookComponent,
    ChartComponent,
    ExchangeOverviewComponent,
    ExchangeAssetPairsComponent,
    ExchangeAssetPairComponent,
    ExchangeTradingViewComponent,
    CurrencySymbolPipe,
    VolumePipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    FormsModule,

    AutoCompleteModule,
    ChartModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }
    )
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    BitfinexService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
