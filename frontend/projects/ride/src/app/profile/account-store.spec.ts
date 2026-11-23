import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AUTH_API, CURRENT_RIDER, RIDERS_API } from '@telo/api';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { AccountStore } from './account-store';

describe('AccountStore (L2-006)', () => {
  let signOutAnswer: () => Observable<void>;
  let deleteAnswer: () => Observable<void>;
  let calls: string[];
  let navigations: [string, unknown][];

  beforeEach(() => {
    calls = [];
    navigations = [];
    signOutAnswer = () => of(undefined);
    deleteAnswer = () => of(undefined);
    TestBed.configureTestingModule({
      providers: [
        AccountStore,
        {
          provide: AUTH_API,
          useValue: {
            signOut: () => {
              calls.push('signOut');
              return signOutAnswer();
            },
          },
        },
        {
          provide: RIDERS_API,
          useValue: {
            deleteMe: () => {
              calls.push('deleteMe');
              return deleteAnswer();
            },
          },
        },
        { provide: CURRENT_RIDER, useValue: { signedOut: () => calls.push('signedOut') } },
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string, extras?: { state?: unknown }) => {
              navigations.push([url, extras?.state]);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });
  });

  const store = () => TestBed.inject(AccountStore);

  it('signs out on the backend, then signs the rider out and opens sign-in (AC1)', async () => {
    await store().signOut();
    expect(calls).toEqual(['signOut', 'signedOut']);
    expect(navigations).toEqual([['/sign-in', undefined]]);
    expect(store().signOutFailed()).toBe(false);
  });

  it('keeps the rider signed in when sign-out cannot reach the backend (AC1)', async () => {
    signOutAnswer = () => throwError(() => new Error('offline'));
    await store().signOut();
    expect(calls).toEqual(['signOut']);
    expect(navigations).toEqual([]);
    expect(store().signOutFailed()).toBe(true);
    expect(store().signingOut()).toBe(false);
  });

  it('signs out once at a time, and a new try clears the failure', async () => {
    signOutAnswer = () => throwError(() => new Error('offline'));
    await store().signOut();
    const pending = new Subject<void>();
    signOutAnswer = () => pending;
    const first = store().signOut();
    expect(store().signOutFailed()).toBe(false);
    expect(store().signingOut()).toBe(true);
    await store().signOut();
    pending.next();
    pending.complete();
    await first;
    expect(calls.filter((call) => call === 'signOut')).toHaveLength(2);
  });

  it('deletes the account, then signs the rider out (AC3)', async () => {
    expect(await store().deleteAccount()).toBe(true);
    expect(calls).toEqual(['deleteMe', 'signedOut']);
    expect(store().deleteFailed()).toBe(false);
  });

  it('keeps the rider when the deletion fails, and says so (AC3)', async () => {
    deleteAnswer = () => throwError(() => new Error('offline'));
    expect(await store().deleteAccount()).toBe(false);
    expect(calls).toEqual(['deleteMe']);
    expect(store().deleteFailed()).toBe(true);
    expect(store().deleting()).toBe(false);
  });

  it('is deleting until the backend answers, and deletes once at a time', async () => {
    const pending = new Subject<void>();
    deleteAnswer = () => pending;
    const first = store().deleteAccount();
    expect(store().deleting()).toBe(true);
    expect(await store().deleteAccount()).toBe(false);
    pending.next();
    pending.complete();
    expect(await first).toBe(true);
    expect(calls.filter((call) => call === 'deleteMe')).toHaveLength(1);
  });

  it('opens sign-in saying the account was deleted', async () => {
    await store().showDeleted();
    expect(navigations).toEqual([['/sign-in', { accountDeleted: true }]]);
  });
});
