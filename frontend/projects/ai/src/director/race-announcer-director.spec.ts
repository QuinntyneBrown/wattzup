// Unit test
// Traces to: L2-170 AC1, AC2, AC3, AC4, AC5, AC6; L2-173 AC4; L2-174 AC2
import type { RaceAnnouncerSnapshot } from '@telo/api';
import { RaceAnnouncerDirector } from './race-announcer-director';

function baseSnapshot(overrides: Partial<RaceAnnouncerSnapshot> = {}): RaceAnnouncerSnapshot {
  return {
    running: true,
    paused: false,
    countdownSeconds: null,
    position: 5,
    totalRiders: 10,
    aheadName: 'Pacer Vale',
    aheadGapMeters: 30,
    targetResistance: 10,
    cadenceRpm: 88,
    targetCadenceRpm: 90,
    ghostGapMeters: null,
    stageIndex: 0,
    stageTitle: 'Warm-up',
    remainingMeters: 5000,
    remainingSeconds: 600,
    finished: false,
    ...overrides,
  };
}

describe('RaceAnnouncerDirector (L2-170, L2-173 AC4)', () => {
  it('announces start countdown without cooldown throttling (L2-170 AC1, AC3)', () => {
    const director = new RaceAnnouncerDirector();
    expect(
      director.evaluate(baseSnapshot({ running: false, countdownSeconds: 3 }), 1000)?.text,
    ).toBe('3!');
    expect(
      director.evaluate(baseSnapshot({ running: false, countdownSeconds: 2 }), 2000)?.text,
    ).toBe('2!');
    expect(
      director.evaluate(baseSnapshot({ running: false, countdownSeconds: 1 }), 3000)?.text,
    ).toBe('1!');
    expect(
      director.evaluate(baseSnapshot({ running: true, countdownSeconds: 0 }), 4000)?.text,
    ).toBe('GO!');
  });

  it('prioritizes higher-priority events and enforces 20 s cooldown (L2-170 AC2, AC3)', () => {
    const director = new RaceAnnouncerDirector();
    director.evaluate(baseSnapshot(), 0);

    // Final sprint (priority 90) preempts simultaneous overtake (70) and climb (50).
    const first = director.evaluate(
      baseSnapshot({
        position: 4,
        stageIndex: 1,
        targetResistance: 18,
        remainingMeters: 450,
      }),
      25_000,
    );
    expect(first?.kind).toBe('finalSprint');
    expect(first?.text).toContain('450 m');

    // Another overtake 5 s later is suppressed by 20 s cooldown.
    expect(
      director.evaluate(baseSnapshot({ position: 3, remainingMeters: 400 }), 30_000),
    ).toBeNull();

    // After 20 s cooldown, overtake fires with exact live standing.
    const next = director.evaluate(baseSnapshot({ position: 2, remainingMeters: 200 }), 46_000);
    expect(next?.kind).toBe('overtake');
    expect(next?.text).toContain('2nd');
  });

  it('clears pending callouts on pause and sanitizes untrusted rider names (L2-170 AC5, L2-174 AC2)', () => {
    const director = new RaceAnnouncerDirector();
    director.evaluate(baseSnapshot({ aheadGapMeters: 30 }), 0);

    const closing = director.evaluate(
      baseSnapshot({ aheadName: '<img src=x onerror=alert(1)>Marco', aheadGapMeters: 12 }),
      25_000,
    );
    expect(closing?.text).toBe('Closing on Marco, 12 m ahead!');

    // Pause suppresses output.
    expect(director.evaluate(baseSnapshot({ paused: true, position: 1 }), 50_000)).toBeNull();
  });

  it('bounds event history ring buffer to 64 entries (L2-173 AC4)', () => {
    const director = new RaceAnnouncerDirector();
    for (let i = 0; i < 80; i += 1) {
      director.evaluate(baseSnapshot({ position: (i % 2) + 1 }), i * 25_000);
    }
    expect(director.history.length).toBeLessThanOrEqual(64);
  });
});
