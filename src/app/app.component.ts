import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Rx';
import 'rxjs/Rx';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  foobar = 'hello world';

  movies: string[] = ['Star Wars', 'Star Trek', 'Shrek'];
  filteredMovies: string[] = [];

  private _onDateUpdate: BehaviorSubject<Date>;

  constructor(
    private _http: Http,
    private _quoteService: BitfenixService) {
  }

  ngOnInit( ) {
    this._onDateUpdate = new BehaviorSubject<Date>( new Date( ) );

    // setInterval(() => {
    //   this._onDateUpdate.next( new Date( ) );
    // }, 1000);

    // this.getSimpleTicks( ).subscribe(
    //   next => console.log( next )
    // );


    setTimeout(( ) => {
      this.getAdvancedTicks( ).subscribe(
        next => {
          console.log( next );
        }
      );
    }, 5000);

  }

  getSimpleTicks( ): BehaviorSubject<Date> {
    return this._onDateUpdate;
  }

  getAdvancedTicks( ): any {
    return this._onDateUpdate.map(
      next => {
        return next.getHours( ) + ':' + next.getMinutes( ) + ':' + next.getSeconds( );
      },
      error => {
        console.log('error');
      }
    );
  }

  requestHttpData( ): void {
    let dateObservable = Observable.create( observer => {
      setInterval( () => {
        observer.next( this.requestQuote('BTC', 'EUR') );
      }, 7500 );
    }).startWith( this.requestQuote('BTC', 'EUR') )
      .flatMap(item => item)
      .share(); // makes this observable 'hot' and therefore there will be only a single instance of this request regardless of the subscriber count.

    dateObservable.subscribe(
      next => console.log(next),
      error => console.log(error),
      () => console.log('complete')
    );

    let displayObservable = dateObservable.map( value => { value.foobar = new Date(); return value; } );
    displayObservable.subscribe(
      next => console.log(next),
      error => console.log(error),
      () => console.log('complete')
    );
  }

  filterMovies(eventData: any): void {
    console.log('filteredMovies called: ' + JSON.stringify(eventData));
    this.filteredMovies = this.movies.filter(movie => movie.toLocaleLowerCase( ).startsWith(eventData.toLocaleLowerCase()) );
  }

  requestQuote( from: string, to: string ): Observable<any> {
    // let apiUrl: string = `https://www.bitstamp.net/api/v2/ticker/${from.toUpperCase()}${to.toUpperCase()}`;
    let apiUrl: string = `https://bitcoinfees.21.co/api/v1/fees/recommended`;
    return this._http.get(apiUrl).map(response => { let json = response.json(); json.fromCurrency = from; json.toCurrency = to; return json; } );
  }
}
