import { BrowserModule,  } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { ServiceProblemsComponent } from './serviceProblems/serviceProblems.component';
import { QuoteComponent } from './quote/quote.component';
import { QuoteService } from 'app/quote/quote.service';

@NgModule({
  declarations: [
    AppComponent,
    ServiceProblemsComponent,
    QuoteComponent
],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [QuoteService],
  bootstrap: [AppComponent]
})
export class AppModule { }
