import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'volumeShortener'
})
export class VolumePipe implements PipeTransform {

  // get the locale from the app.module by injection
  constructor(@Inject(LOCALE_ID) private _locale: string) {
  }

  transform(value: number, args?: any): any {
    if (value >= 1000000) {
      return new DecimalPipe(this._locale).transform( value / 1000000, '1.2-2') + 'M';
    }
    if (value >= 10000 ) {
      return new DecimalPipe(this._locale).transform( value / 1000, '1.2-2' ) + 'K';
    }
    return new DecimalPipe(this._locale).transform(value, '1.2-2');
  }
}
