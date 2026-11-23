// Unit test (the slice's acceptance table: no screen shows telemetry until slice 3.2)
// Traces to: L2-020 AC1, AC2, AC5; L2-021 AC2 to AC4; L2-022 AC1; L2-023 AC1, AC2; L2-024
// Description: BikeTelemetry decodes the connection's notifications by the bike's kind and merges them into live
// signals: an Echelon's speed and power are estimated, an FTMS bike's reported power and speed are used as they are,
// an absent field falls back to its estimate or to null, and 5 seconds without cadence blanks cadence and power.
// A fake connection pushes the bytes a bike sends, and the simulated bike runs it end to end; Vitest's fake clock
// moves time.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  TICKER,
  type BikeConnection,
  type BikeInfo,
  type BikeKind,
} from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { PowerModel } from './power-model';
import { SpeedModel } from './speed-model';

const bytes = (hex: string) => Uint8Array.from(hex.split(' '), (b) => parseInt(b, 16));
/** Echelon: resistance 12; cadence 80 rpm; cadence 95 rpm; resistance 18. */
const D2_12 = bytes('F0 D2 01 0C CF');
const D1_80 = bytes('F0 D1 09 00 05 00 00 00 00 00 50 00 1F');
const D1_95 = bytes('F0 D1 09 00 06 00 00 00 00 00 5F 00 2F');
const D2_18 = bytes('F0 D2 01 12 D5');
/** FTMS Indoor Bike Data: speed 28.45 km/h, cadence 80.5 rpm, power 212 W (flags 0x0044). */
const FTMS_ALL = bytes('44 00 1D 0B A1 00 D4 00');
/** FTMS Indoor Bike Data with More Data set: cadence 80 rpm only (flags 0x0005). */
const FTMS_CADENCE = bytes('05 00 A0 00');

describe('BikeTelemetry', () => {
  let frames: Subject<Uint8Array>;
  let kind: ReturnType<typeof signal<BikeInfo | null>>;
  let telemetry: BikeTelemetry;

  const as = (bikeKind: BikeKind) =>
    kind.set({ id: 'bike-1', name: 'Bike', identifier: null, kind: bikeKind });
  const send = (...notifications: Uint8Array[]) => notifications.forEach((n) => frames.next(n));

  beforeEach(() => {
    vi.useFakeTimers();
    frames = new Subject<Uint8Array>();
    kind = signal<BikeInfo | null>(null);
    as('echelon');
    const connection: Partial<BikeConnection> = { frames, bike: kind.asReadonly() };
    TestBed.configureTestingModule({
      providers: [BikeTelemetry, { provide: BIKE_CONNECTION, useValue: connection }],
    });
    telemetry = TestBed.inject(BikeTelemetry);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('shows nothing before the bike sends anything', () => {
    expect(telemetry.cadence()).toBeNull();
    expect(telemetry.resistance()).toBeNull();
    expect(telemetry.speedKmh()).toBeNull();
    expect(telemetry.powerW()).toBeNull();
  });

  it('decodes an Echelon D2 as resistance and a D1 as cadence (L2-020 AC1, AC2)', () => {
    send(D2_12, D1_80);

    expect(telemetry.resistance()).toBe(12);
    expect(telemetry.cadence()).toBe(80);
  });

  it('estimates an Echelon speed from cadence, and power from cadence and resistance (L2-022 AC1, L2-023 AC1)', () => {
    send(D2_18, D1_95);

    expect(telemetry.speedKmh()).toBe(35.6);
    expect(telemetry.powerW()).toBe(317);
    expect(telemetry.powerIsEstimate()).toBe(true);

    send(D1_80);
    expect(telemetry.speedKmh()).toBe(30);
  });

  it('leaves power unknown until both cadence and resistance are known (L2-023 AC2)', () => {
    send(D1_80);
    expect(telemetry.powerW()).toBeNull();

    send(D2_12);
    expect(telemetry.powerW()).toBe(193);
  });

  it('changes nothing on a frame it ignores (L2-020 AC3, AC4)', () => {
    send(D2_12, D1_80);

    send(
      bytes('F0 D2 01'),
      bytes('F1 D2 01 0C D0'),
      bytes('F0 D0 01 00 C1'),
      bytes('F0 D1 09 00 05'),
    );

    expect([telemetry.cadence(), telemetry.resistance()]).toEqual([80, 12]);
  });

  it('blanks cadence and power after 5 seconds without a D1, not before (L2-020 AC5)', () => {
    send(D2_12, D1_80);

    vi.advanceTimersByTime(4000);
    send(D1_80, D2_12);
    vi.advanceTimersByTime(4999);
    expect(telemetry.cadence()).toBe(80);

    send(D2_12);
    vi.advanceTimersByTime(1);
    expect(telemetry.cadence()).toBeNull();
    expect(telemetry.powerW()).toBeNull();
    expect(telemetry.speedKmh()).toBeNull();
    expect(telemetry.resistance()).toBe(12);

    send(D1_80);
    expect(telemetry.cadence()).toBe(80);
  });

  it('uses an FTMS bike’s reported power and speed as they are (L2-021 AC2, AC3)', () => {
    as('ftms');
    send(FTMS_ALL);

    expect(telemetry.speedKmh()).toBe(28.45);
    expect(telemetry.cadence()).toBe(80.5);
    expect(telemetry.powerW()).toBe(212);
    expect(telemetry.powerIsEstimate()).toBe(false);
  });

  it('falls back to the estimate, or to unknown, for a field the flags mark absent (L2-021 AC4)', () => {
    as('ftms');
    send(FTMS_ALL, FTMS_CADENCE);

    expect(telemetry.speedKmh()).toBe(30);
    expect(telemetry.powerW()).toBeNull();
    expect(telemetry.powerIsEstimate()).toBe(true);
  });

  it('releases the notifications and the timer when it is destroyed', () => {
    send(D1_80);

    TestBed.resetTestingModule();
    send(D1_95);

    expect(telemetry.cadence()).toBe(80);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('BikeTelemetry on the simulated bike', () => {
  it('reads the simulated Echelon’s cadence and resistance, and estimates its speed and power (L2-024)', async () => {
    const second = new Subject<number>();
    TestBed.configureTestingModule({
      providers: [
        BikeTelemetry,
        SimulatedBikeConnection,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    await bike.requestBike();
    await bike.connect();
    await bike.setResistance(14);

    second.next(0);

    const cadence = telemetry.cadence();
    expect(cadence).toBeGreaterThan(0);
    expect(telemetry.resistance()).toBe(14);
    expect(telemetry.speedKmh()).toBe(SpeedModel.speedKmh(cadence ?? 0));
    expect(telemetry.powerW()).toBe(PowerModel.estimate(cadence, 14));
    TestBed.resetTestingModule();
  });
});

describe('BikeTelemetry heart rate', () => {
  /** FTMS Indoor Bike Data with More Data set and heart rate 151 bpm (flags 0x0201). */
  const FTMS_HEART = Uint8Array.from([0x01, 0x02, 151]);

  it('shows the heart rate an FTMS bike reports, and blanks it after 5 seconds without one (L2-030 AC1)', () => {
    vi.useFakeTimers();
    const frames = new Subject<Uint8Array>();
    const bike = signal<BikeInfo | null>({ id: 'b', name: 'Bike', identifier: null, kind: 'ftms' });
    TestBed.configureTestingModule({
      providers: [BikeTelemetry, { provide: BIKE_CONNECTION, useValue: { frames, bike } }],
    });
    const telemetry = TestBed.inject(BikeTelemetry);
    expect(telemetry.heartRate()).toBeNull();

    frames.next(FTMS_HEART);
    expect(telemetry.heartRate()).toBe(151);

    vi.advanceTimersByTime(4999);
    expect(telemetry.heartRate()).toBe(151);
    vi.advanceTimersByTime(1);
    expect(telemetry.heartRate()).toBeNull();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
});
