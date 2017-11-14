import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AssetPairSearchService implements OnDestroy {
  private _observable: BehaviorSubject<string>;

  constructor() {
    this._observable = new BehaviorSubject( '' );
  }

  triggerAssetSearch(input: string): void {
    if (this._observable) {
      this._observable.next( input );
    }
  }

  getListener( ): Observable<string> {
    return this._observable;
  }

  ngOnDestroy( ) {
    // if (this._observable) {
    //   this._observable.unsubscribe( );
    // }
  }
}
