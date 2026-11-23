// Unit test
// Traces to: L2-015 AC1, L2-113 AC4
// Description: the remembered bike survives a reload as one localStorage record; a record it cannot read counts as
// no bike, and forgetting removes it. It knows when the bike was last seen: when it was last saved, or for a record
// from before, when it was paired.
import { TestBed } from '@angular/core/testing';
import type { BikeInfo } from '@telo/api';
import { REMEMBERED_BIKE_KEY, RememberedBikeStore } from './remembered-bike-store';

const BIKE: BikeInfo = {
  id: 'kK3fA9==',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-141844',
  kind: 'echelon',
};

describe('RememberedBikeStore', () => {
  let store: RememberedBikeStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [RememberedBikeStore] });
    store = TestBed.inject(RememberedBikeStore);
  });

  it('has no bike until one is saved', () => {
    expect(store.get()).toBeNull();
  });

  it('gives back the bike it saved, from a fresh store', () => {
    store.save(BIKE);

    expect(TestBed.runInInjectionContext(() => new RememberedBikeStore()).get()).toEqual(BIKE);
  });

  it.each([
    ['not JSON', '{'],
    ['not an object', '"bike"'],
    ['no id', JSON.stringify({ name: 'Echelon EX-5s', identifier: null, kind: 'echelon' })],
    ['an unknown kind', JSON.stringify({ id: 'a', name: 'b', identifier: null, kind: 'rower' })],
    ['a numeric identifier', JSON.stringify({ id: 'a', name: 'b', identifier: 5, kind: 'ftms' })],
  ])('counts a record that is %s as no bike', (_, raw) => {
    localStorage.setItem(REMEMBERED_BIKE_KEY, raw);

    expect(store.get()).toBeNull();
  });

  it('knows when the bike was last seen: when it was last saved', () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 10, 20) });
    store.save(BIKE);
    vi.useRealTimers();

    expect(store.lastSeen()).toEqual(new Date(Date.UTC(2026, 10, 20)));
  });

  it.each([
    [
      'a record from before slice 25.1, by when it was paired',
      { pairedAt: '2026-11-01T08:00:00.000Z' },
      new Date('2026-11-01T08:00:00.000Z'),
    ],
    ['no time', {}, null],
    ['a time it cannot read', { seenAt: 'soon' }, null],
  ])('reads %s', (_, extra, seen) => {
    localStorage.setItem(REMEMBERED_BIKE_KEY, JSON.stringify({ ...BIKE, ...extra }));

    expect(store.lastSeen()).toEqual(seen);
  });

  it('has no time without a bike', () => {
    expect(store.lastSeen()).toBeNull();
  });

  it('forgets the bike', () => {
    store.save(BIKE);
    store.forget();

    expect(store.get()).toBeNull();
  });
});
