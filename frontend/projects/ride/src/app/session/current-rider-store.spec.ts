import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RIDERS_API, type RiderMe } from '@telo/api';
import { type Observable, of, throwError } from 'rxjs';
import { CurrentRiderStore } from './current-rider-store';

describe('CurrentRiderStore (L2-004 AC3, AC5)', () => {
  const ada: RiderMe = { id: 'rider-1', displayName: 'Ada' };
  let answer: () => Observable<RiderMe>;
  let asked: number;

  beforeEach(() => {
    asked = 0;
    answer = () => of(ada);
    TestBed.configureTestingModule({
      providers: [
        CurrentRiderStore,
        {
          provide: RIDERS_API,
          useValue: {
            me: () => {
              asked++;
              return answer();
            },
          },
        },
      ],
    });
  });

  const store = () => TestBed.inject(CurrentRiderStore);

  it('is unknown until asked', () => {
    expect(store().status()).toBe('unknown');
  });

  it('asks once and knows the rider', async () => {
    const [first, second] = await Promise.all([store().load(), store().load()]);
    expect([first, second]).toEqual(['signedIn', 'signedIn']);
    expect(await store().load()).toBe('signedIn');
    expect(store().rider()).toEqual(ada);
    expect(asked).toBe(1);
  });

  it('is signed out when the backend answers 401', async () => {
    answer = () => throwError(() => new HttpErrorResponse({ status: 401 }));
    expect(await store().load()).toBe('signedOut');
    expect(store().rider()).toBeNull();
  });

  it.each([0, 404, 500, 503])('is unreachable when the backend answers %s', async (status) => {
    answer = () => throwError(() => new HttpErrorResponse({ status }));
    expect(await store().load()).toBe('unreachable');
  });

  it('takes a sign-in from the code screen, and a session ending from a 401', async () => {
    store().signedIn(ada);
    expect(await store().load()).toBe('signedIn');
    expect(asked).toBe(0);
    store().signedOut();
    expect(await store().load()).toBe('signedOut');
  });
});
