// Unit test (the slice's acceptance table: saving a ride comes with journey 10)
// Traces to: L2-031 AC5
// Description: on each running second the ride's average and peak heart rate take in the heart rate shown, skipping
// seconds without one, as two numbers and a count rather than a trace. A fake HeartRateSource gives the bpm.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HeartRateSource } from './heart-rate-source';
import { HeartRateStats } from './heart-rate-stats';

describe('HeartRateStats', () => {
  const bpm = signal<number | null>(null);
  let stats: HeartRateStats;

  const ride = (...beats: (number | null)[]) =>
    beats.forEach((beat) => {
      bpm.set(beat);
      stats.onRunningSecond();
    });

  beforeEach(() => {
    bpm.set(null);
    TestBed.configureTestingModule({
      providers: [HeartRateStats, { provide: HeartRateSource, useValue: { bpm } }],
    });
    stats = TestBed.inject(HeartRateStats);
  });

  it('keeps the ride’s average and peak heart rate (AC5)', () => {
    ride(140, 150, 160);

    expect(stats.average()).toBe(150);
    expect(stats.peak()).toBe(160);
  });

  it('rounds the average to a whole bpm', () => {
    ride(140, 141);

    expect(stats.average()).toBe(141);
  });

  it('skips the seconds with no heart rate', () => {
    ride(120, null, null, 130);

    expect(stats.average()).toBe(125);
    expect(stats.peak()).toBe(130);
  });

  it('has neither while no heart rate has been shown', () => {
    ride(null, null);

    expect(stats.average()).toBeNull();
    expect(stats.peak()).toBeNull();
  });
});
