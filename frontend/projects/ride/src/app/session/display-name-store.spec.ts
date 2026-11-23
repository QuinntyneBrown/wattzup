import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CURRENT_RIDER, RIDERS_API, type RiderMe } from '@telo/api';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { DisplayNameStore } from './display-name-store';

describe('DisplayNameStore (L2-005 AC2)', () => {
  let answer: () => Observable<RiderMe>;
  let saved: string[];
  let signedIn: RiderMe[];

  beforeEach(() => {
    saved = [];
    signedIn = [];
    answer = () => of({ id: 'rider-1', displayName: 'Sam' });
    TestBed.configureTestingModule({
      providers: [
        DisplayNameStore,
        {
          provide: RIDERS_API,
          useValue: {
            setDisplayName: (name: string) => {
              saved.push(name);
              return answer();
            },
          },
        },
        {
          provide: CURRENT_RIDER,
          useValue: { signedIn: (rider: RiderMe) => signedIn.push(rider) },
        },
      ],
    });
  });

  const store = () => TestBed.inject(DisplayNameStore);

  it('saves the name and tells the current rider', async () => {
    expect(await store().save('Sam')).toBe(true);
    expect(saved).toEqual(['Sam']);
    expect(signedIn).toEqual([{ id: 'rider-1', displayName: 'Sam' }]);
    expect(store().error()).toBeNull();
  });

  it('is saving until the backend answers, and saves once at a time', async () => {
    const pending = new Subject<RiderMe>();
    answer = () => pending;
    const first = store().save('Sam');
    expect(store().saving()).toBe(true);
    expect(await store().save('Sam again')).toBe(false);
    pending.next({ id: 'rider-1', displayName: 'Sam' });
    pending.complete();
    expect(await first).toBe(true);
    expect(store().saving()).toBe(false);
    expect(saved).toEqual(['Sam']);
  });

  it('knows a name the backend refused', async () => {
    answer = () =>
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { code: 'display_name_invalid' } }),
      );
    expect(await store().save('Sam')).toBe(false);
    expect(store().error()).toBe('refused');
    expect(store().refusals()).toBe(1);
    expect(signedIn).toEqual([]);
  });

  it.each(['S', '<b>Sam</b>', 'abcdefghijklmnopqrstuvwxy'])(
    'refuses %j at once, without asking the backend',
    async (name) => {
      expect(await store().save(name)).toBe(false);
      expect(await store().save(name)).toBe(false);
      expect(store().error()).toBe('refused');
      expect(store().refusals()).toBe(2);
      expect(saved).toEqual([]);
    },
  );

  it.each([
    new HttpErrorResponse({ status: 0 }),
    new HttpErrorResponse({ status: 503 }),
    new HttpErrorResponse({ status: 400, error: { code: 'validation_failed' } }),
    new Error('offline'),
  ])('counts any other failure as failed (%#)', async (failure) => {
    answer = () => throwError(() => failure);
    expect(await store().save('Sam')).toBe(false);
    expect(store().error()).toBe('failed');
  });

  it('forgets the last failure when it saves again', async () => {
    answer = () => throwError(() => new HttpErrorResponse({ status: 503 }));
    await store().save('Sam');
    answer = () => of({ id: 'rider-1', displayName: 'Sam' });
    await store().save('Sam');
    expect(store().error()).toBeNull();
  });
});
