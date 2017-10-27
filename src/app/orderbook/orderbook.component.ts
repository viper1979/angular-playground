import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import { BitfenixService } from 'app/api/bitfenix/bitfenix.service';

@Component({
  selector: 'app-orderbook',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.css']
})
export class OrderbookComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  symbol: string;

  constructor(private _orderbookService: BitfenixService) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('OrderbookComponent | ngOnChanges | changes: ' + JSON.stringify(changes) );
  }

  ngOnDestroy() {
  }
}
