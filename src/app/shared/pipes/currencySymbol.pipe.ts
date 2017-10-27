import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'currencySymbol'
})
export class CurrencySymbolPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
  }

  transform(value: string, args?: any): any {
    // return this.sanitizer.bypassSecurityTrustHtml('<script>console.log("haha");</script>');

    switch (value) {
      case 'GBP':
      case 'INR':
      case 'JPY':
      case 'RUB':
      case 'KRW':
      case 'EUR':
      case 'USD':
      case 'BTC': {
        return this.sanitizer.bypassSecurityTrustHtml( `<i class="fa fa-${value.toLowerCase()}" aria-hidden="true"></i>` );
      }
      default: {
        return value;
      }
    }
  }
}
