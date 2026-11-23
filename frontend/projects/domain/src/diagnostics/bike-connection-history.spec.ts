// Unit test
// Traces to: L2-113 AC2, AC4
// Description: the link's history follows the connection: when it connected, how often it came back after a drop, a
// fresh start from idle, and the remembered bike saved again each time it connects.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BIKE_CONNECTION, type BikeInfo, type BleState, REMEMBERED_BIKE } from '@telo/api';
import { BikeConnectionHistory } from './bike-connection-history';

const BIKE: BikeInfo = { id: 'k', name: 'Echelon EX-5s', identifier: null, kind: 'echelon' };

describe('BikeConnectionHistory', () => {
  let ble: ReturnType<typeof signal<BleState>>;
  let saved: BikeInfo[];
  let history: BikeConnectionHistory;

  function step(state: BleState): void {
    ble.set(state);
    TestBed.tick();
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: 1_000_000 });
    ble = signal<BleState>('idle');
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        BikeConnectionHistory,
        { provide: BIKE_CONNECTION, useValue: { ble, bike: signal(BIKE) } },
        {
          provide: REMEMBERED_BIKE,
          useValue: { get: () => BIKE, save: (bike: BikeInfo) => saved.push(bike) },
        },
      ],
    });
    history = TestBed.inject(BikeConnectionHistory);
    TestBed.tick();
  });

  afterEach(() => vi.useRealTimers());

  it('knows nothing before the bike connects', () => {
    expect(history.connectedSince()).toBeNull();
    expect(history.reconnects()).toBe(0);
  });

  it('notes when the link connected, and saves the remembered bike as seen', () => {
    step('connecting');
    vi.advanceTimersByTime(500);
    step('connected');

    expect(history.connectedSince()).toBe(1_000_500);
    expect(history.reconnects()).toBe(0);
    expect(saved).toEqual([BIKE]);
  });

  it('counts each time the link comes back after a drop', () => {
    step('connected');
    step('disconnected');
    expect(history.connectedSince()).toBeNull();
    step('connecting');
    vi.advanceTimersByTime(2000);
    step('connected');
    step('disconnected');
    step('connected');

    expect(history.reconnects()).toBe(2);
    expect(history.connectedSince()).toBe(1_002_000);
  });

  it('starts again when the link is left alone', () => {
    step('connected');
    step('disconnected');
    step('connected');
    step('idle');
    step('connected');

    expect(history.reconnects()).toBe(0);
  });
});
