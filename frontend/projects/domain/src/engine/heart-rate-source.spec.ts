// Unit test (the slice's acceptance table: no screen shows heart rate until the ride screens)
// Traces to: L2-030 AC1 to AC3; L2-031 AC4
// Description: the heart readout uses the strap's bpm when it reports one, else the bike's, else nothing, read "—"
// and announced as "No heart rate"; each source blanks itself after 5 quiet seconds, so a dropped strap gives way to
// the bike or to "—". Fake sources stand in for the strap and BikeTelemetry.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HEART_RATE_STRAP } from '@telo/api';
import { BikeTelemetry } from './bike-telemetry';
import { HeartRateSource } from './heart-rate-source';

describe('HeartRateSource', () => {
  const strap = signal<number | null>(null);
  const bike = signal<number | null>(null);
  let source: HeartRateSource;

  beforeEach(() => {
    strap.set(null);
    bike.set(null);
    TestBed.configureTestingModule({
      providers: [
        HeartRateSource,
        { provide: HEART_RATE_STRAP, useValue: { bpm: strap } },
        { provide: BikeTelemetry, useValue: { heartRate: bike } },
      ],
    });
    source = TestBed.inject(HeartRateSource);
  });

  it('shows the bike’s heart rate when it is the only source (L2-030 AC1)', () => {
    bike.set(138);

    expect(source.bpm()).toBe(138);
    expect(source.announcement()).toBe('Heart rate 138 bpm');
  });

  it('uses the strap’s value when the bike and a strap both report one (L2-030 AC2)', () => {
    bike.set(138);
    strap.set(142);

    expect(source.bpm()).toBe(142);
  });

  it('reads nothing, announced as "No heart rate", with no source (L2-030 AC3)', () => {
    expect(source.bpm()).toBeNull();
    expect(source.announcement()).toBe('No heart rate');
  });

  it('gives way to the bike, then to nothing, as the strap and the bike go quiet (L2-031 AC4)', () => {
    bike.set(138);
    strap.set(142);

    strap.set(null);
    expect(source.bpm()).toBe(138);

    bike.set(null);
    expect(source.bpm()).toBeNull();
  });
});
