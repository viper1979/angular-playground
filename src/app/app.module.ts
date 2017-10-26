import { BrowserModule,  } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { ServiceProblemsComponent } from './serviceProblems/serviceProblems.component';
import { QuoteComponent } from './quote/quote.component';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';
import { TickerComponent } from './ticker/ticker.component';

@NgModule({
  declarations: [
    AppComponent,
    ServiceProblemsComponent,
    QuoteComponent,
    TickerComponent
],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [BitfenixService],
  bootstrap: [AppComponent]
})
export class AppModule { }
