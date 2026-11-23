// Unit test (the slice's acceptance table: the class ride screen that hosts it comes with slice 5.2)
// Traces to: L2-027 AC1, AC3; L2-133 AC2; L2-134 AC2
// Description: the engine follows a plan on the ride clock: it sends the first segment's level as the ride starts and
// each next level within 500 ms of its boundary, keeps the segment's time left once a second, sends nothing while
// paused, and after a hidden tab lands on the right segment and sends only its level. Fake timers, never sleeps; the
// simulated bike runs the path end to end.
import { TestBed } from '@angular/core/testing';
import { BIKE_CONNECTION, MONOTONIC_TIME, type Plan, TICKER } from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { ResistanceController } from './resistance-controller';
import { RideClock } from './ride-clock';
import { RideTicker } from './ride-ticker';
import { WorkoutEngine } from './workout-engine';

const plan: Plan = {
  segments: [
    { kind: 'warm-up', duration: 300, level: 8, cadenceAim: 80 },
    { kind: 'work', duration: 600, level: 18, cadenceAim: 100 },
    { kind: 'recover', duration: 300, level: 6, cadenceAim: 72 },
  ],
};

const monotonic = { provide: MONOTONIC_TIME, useValue: { now: () => Date.now() } };

describe('WorkoutEngine', () => {
  let sent: number[];
  let clock: RideClock;
  let engine: WorkoutEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        RideClock,
        RideTicker,
        WorkoutEngine,
        monotonic,
        {
          provide: ResistanceController,
          useValue: { applyPlanLevel: async (level: number) => void sent.push(level) },
        },
      ],
    });
    clock = TestBed.inject(RideClock);
    engine = TestBed.inject(WorkoutEngine);
    clock.start();
    TestBed.inject(RideTicker).start();
    engine.follow(plan);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sends the first segment’s level as the ride starts (L2-027 AC1)', () => {
    expect(sent).toEqual([8]);
    expect(engine.state()).toMatchObject({
      index: 0,
      segment: { kind: 'warm-up' },
      remainingMs: 300_000,
    });
  });

  it('sends the next segment’s level within 500 ms of its boundary (L2-027 AC1)', () => {
    vi.advanceTimersByTime(299_999);
    expect(sent).toEqual([8]);

    vi.advanceTimersByTime(500);

    expect(sent).toEqual([8, 18]);
    expect(engine.state()).toMatchObject({ index: 1, segment: { kind: 'work' }, targetPower: 334 });
  });

  it('counts the segment’s time left down once a second (L2-134 AC2)', () => {
    vi.advanceTimersByTime(1_000);
    expect(engine.state()?.remainingMs).toBe(299_000);

    vi.advanceTimersByTime(1_000);
    expect(engine.state()?.remainingMs).toBe(298_000);
  });

  it('changes no segment and sends nothing while paused (L2-027 AC3)', () => {
    vi.advanceTimersByTime(290_000);
    clock.pause();

    vi.advanceTimersByTime(120_000);

    expect(sent).toEqual([8]);
    expect(engine.state()).toMatchObject({ index: 0, remainingMs: 10_000 });
  });

  it('lands on the right segment after a hidden tab, and sends only its level (L2-133 AC2)', () => {
    vi.setSystemTime(Date.now() + 600_000);

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(sent).toEqual([8, 18]);
    expect(engine.state()).toMatchObject({ index: 1, remainingMs: 300_000 });
  });

  it('sends nothing more once the plan has ended', () => {
    vi.advanceTimersByTime(1_260_000);

    expect(sent).toEqual([8, 18, 6]);
    expect(engine.state()).toBeNull();
  });
});

describe('WorkoutEngine on the simulated bike', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('the bike follows the plan’s levels segment by segment and reports them back (L2-027 AC1)', async () => {
    const second = new Subject<number>();
    TestBed.configureTestingModule({
      providers: [
        RideClock,
        RideTicker,
        WorkoutEngine,
        ResistanceController,
        BikeTelemetry,
        SimulatedBikeConnection,
        monotonic,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    await bike.requestBike();
    await bike.connect();
    vi.useFakeTimers();
    TestBed.inject(RideClock).start();
    TestBed.inject(RideTicker).start();
    TestBed.inject(WorkoutEngine).follow({
      segments: [
        { kind: 'warm-up', duration: 2, level: 8, cadenceAim: 80 },
        { kind: 'work', duration: 3, level: 14, cadenceAim: 100 },
      ],
    });

    await vi.advanceTimersByTimeAsync(0);
    second.next(1);
    expect(telemetry.resistance()).toBe(8);

    await vi.advanceTimersByTimeAsync(2_000);
    second.next(2);
    expect(telemetry.resistance()).toBe(14);
  });
});
