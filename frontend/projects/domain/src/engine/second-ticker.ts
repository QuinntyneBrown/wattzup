import { Injectable } from '@angular/core';
import type { Ticker } from '@telo/api';
import { Observable } from 'rxjs';

/**
 * The real `TICKER`: once a second while subscribed. Each subscription owns its interval and clears it when it
 * unsubscribes. Built on `Observable` alone, which the router already loads, to keep the initial bundle small.
 */
@Injectable()
export class SecondTicker implements Ticker {
  readonly seconds = new Observable<number>((subscriber) => {
    let count = 0;
    const id = setInterval(() => subscriber.next(++count), 1000);
    return () => clearInterval(id);
  });
}
