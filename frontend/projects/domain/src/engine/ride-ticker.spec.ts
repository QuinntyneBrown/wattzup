// Unit test (the slice's acceptance table: the readouts it drives come with slice 5.2)
// Traces to: L2-133 AC2; L2-134 AC2; L2-121 AC3
// Description: the ticker publishes each whole second of the ride clock once, at once for a clock started in the past,
// catches up at once when a hidden tab is shown again, and releases its timer and listener when it stops or its owner is destroyed. Fake timers, never sleeps.
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME } from '@telo/api';
import { RideClock } from './ride-clock';
import { RideTicker } from './ride-ticker';

describe('RideTicker', () => {
  let clock: RideClock;
  let ticker: RideTicker;
  let ticks: number[];

  const showTab = () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        RideClock,
        RideTicker,
        { provide: MONOTONIC_TIME, useValue: { now: () => Date.now() } },
      ],
    });
    clock = TestBed.inject(RideClock);
    ticker = TestBed.inject(RideTicker);
    ticks = [];
    ticker.ticks.subscribe((second) => ticks.push(second));
    clock.start();
    ticker.start();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('publishes each whole second of the ride clock once (L2-134 AC2)', () => {
    vi.advanceTimersByTime(3_000);

    expect(ticks).toEqual([1, 2, 3]);
    expect(ticker.second()).toBe(3);
  });

  it('publishes the second of a clock started in the past at once, as a late rider joins a live session (L2-121 AC3)', () => {
    ticker.stop();
    clock.start(Date.now() - 4_500);
    ticker.start();

    expect(ticker.second()).toBe(4);
    expect(ticks).toEqual([4]);
    vi.advanceTimersByTime(500);
    expect(ticks).toEqual([4, 5]);
  });

  it('publishes no new second while the ride is paused', () => {
    vi.advanceTimersByTime(2_500);
    clock.pause();
    vi.advanceTimersByTime(5_000);

    expect(ticks).toEqual([1, 2]);
  });

  it('catches up at once when a hidden tab is shown again after 10 minutes (L2-133 AC2)', () => {
    vi.advanceTimersByTime(1_000);
    vi.setSystemTime(Date.now() + 600_000);

    showTab();

    expect(ticker.second()).toBe(601);
    expect(ticks).toEqual([1, 601]);
  });

  it('releases its timer and its listener when it stops', () => {
    ticker.stop();

    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(Date.now() + 5_000);
    showTab();
    expect(ticks).toEqual([]);
  });

  it('stops when its owner is destroyed', () => {
    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
  });
});
