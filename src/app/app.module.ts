import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule, LOCALE_ID } from '@angular/core';
import { AppComponent } from './app.component';
import { ServiceProblemsComponent } from './serviceProblems/serviceProblems.component';
import { QuoteComponent } from './quote/quote.component';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';
import { TickerComponent } from './ticker/ticker.component';
import { OrderbookComponent } from './orderbook/orderbook.component';

import { AutoCompleteModule } from 'primeng/primeng';
import { CurrencySymbolPipe } from 'app/shared/pipes/currencySymbol.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ServiceProblemsComponent,
    QuoteComponent,
    TickerComponent,
    OrderbookComponent,

    CurrencySymbolPipe
],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,

    AutoCompleteModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    BitfenixService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
