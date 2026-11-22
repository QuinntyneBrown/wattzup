// Unit test (the slice's acceptance table: the ride screens that show resistance come with journeys 5, 7 and 21)
// Traces to: L2-025 AC2, AC4; L2-026 AC1; L2-027 AC1, AC4; L2-028 AC1 to AC4
// Description: a plan's level becomes the target resistance, clamped to 1 to 32 and sent, with its acknowledgement
// time kept; the bike's reported resistance stays apart from the target; with the bike away or refusing control the
// controller cannot control it, and the connection keeps the target for the reconnect. A fake connection stands in
// for the bike, and the simulated bike runs the path end to end.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  type BikeConnection,
  type BleState,
  MONOTONIC_TIME,
  TICKER,
} from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { ResistanceController } from './resistance-controller';
import { RideClock } from './ride-clock';

describe('ResistanceController', () => {
  const ble = signal<BleState>('connected');
  let setResistance: ReturnType<typeof vi.fn<(level: number) => Promise<number>>>;
  let controller: ResistanceController;

  beforeEach(() => {
    ble.set('connected');
    setResistance = vi.fn(async () => 34);
    const connection: Partial<BikeConnection> = { ble, setResistance };
    TestBed.configureTestingModule({
      providers: [ResistanceController, { provide: BIKE_CONNECTION, useValue: connection }],
    });
    controller = TestBed.inject(ResistanceController);
  });

  it('sends a plan’s level as the target resistance, and keeps its acknowledgement time (L2-027 AC1, L2-025 AC4)', async () => {
    await controller.applyPlanLevel(12);

    expect(setResistance).toHaveBeenCalledWith(12);
    expect(controller.target()).toBe(12);
    expect(controller.source()).toBe('plan');
    expect(controller.last()).toEqual({ rideTime: null, level: 12, source: 'plan', ackMs: 34 });
  });

  it.each([
    [40, 32],
    [33, 32],
    [0, 1],
    [-3, 1],
    [12.6, 13],
  ])('clamps a target of %d to %d before it is sent (L2-025 AC2)', async (level, sent) => {
    await controller.applyPlanLevel(level);

    expect(setResistance).toHaveBeenCalledWith(sent);
    expect(controller.target()).toBe(sent);
  });

  it('can control a connected bike', () => {
    expect(controller.canControl()).toBe(true);
  });

  it('cannot control a bike that is away, but asks the connection, which keeps the target for the reconnect (L2-027 AC4, L2-028 AC4)', async () => {
    ble.set('disconnected');
    setResistance.mockRejectedValue(new BikeConnectionError('failed', 'The bike is not connected'));

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(setResistance).toHaveBeenCalledWith(10);
    expect(controller.target()).toBe(10);
    expect(controller.last()).toBeNull();
  });

  it('stops controlling an FTMS bike once it refuses control (L2-028 AC4)', async () => {
    setResistance.mockRejectedValue(
      new BikeConnectionError('read-only', 'The bike does not give control'),
    );

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(controller.last()).toBeNull();
  });
});

describe('ResistanceController on the simulated bike', () => {
  it('the bike follows the target and reports it back as its resistance, kept apart from the target (L2-026 AC1)', async () => {
    const second = new Subject<number>();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        BikeTelemetry,
        SimulatedBikeConnection,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    const controller = TestBed.inject(ResistanceController);
    await bike.requestBike();
    await bike.connect();

    await controller.applyPlanLevel(14);
    second.next(0);

    expect(telemetry.resistance()).toBe(14);
    expect(controller.target()).toBe(14);
    expect(controller.last()).toEqual({ rideTime: null, level: 14, source: 'plan', ackMs: 0 });
    TestBed.resetTestingModule();
  });
});

describe('ResistanceController by hand', () => {
  const ble = signal<BleState>('connected');
  const reported = signal<number | null>(null);
  let setResistance: ReturnType<typeof vi.fn<(level: number) => Promise<number>>>;
  let controller: ResistanceController;

  beforeEach(() => {
    ble.set('connected');
    reported.set(null);
    setResistance = vi.fn(async () => 30);
    const connection: Partial<BikeConnection> = { ble, setResistance };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        { provide: BIKE_CONNECTION, useValue: connection },
        { provide: BikeTelemetry, useValue: { resistance: reported } },
      ],
    });
    controller = TestBed.inject(ResistanceController);
  });

  it('raises and lowers the target by one level and sends it, as the rider’s own (L2-028 AC1)', async () => {
    await controller.applyPlanLevel(12);

    await controller.nudge(1);
    expect(setResistance).toHaveBeenLastCalledWith(13);
    expect(controller.target()).toBe(13);
    expect(controller.source()).toBe('manual');

    await controller.nudge(-1);
    await controller.nudge(-1);
    expect(controller.target()).toBe(11);
    expect(controller.last()).toEqual({ rideTime: null, level: 11, source: 'manual', ackMs: 30 });
  });

  it.each([
    [32, 1, 32],
    [1, -1, 1],
  ] as const)(
    'keeps a target of %d at %d after a nudge of %d, clamped to 1 to 32 (L2-028 AC1)',
    async (level, delta, kept) => {
      await controller.applyPlanLevel(level);

      await controller.nudge(delta);

      expect(controller.target()).toBe(kept);
    },
  );

  it('nudges from the bike’s reported resistance before any target', async () => {
    reported.set(8);

    await controller.nudge(1);

    expect(setResistance).toHaveBeenCalledWith(9);
  });

  it('sets the level the rider picks as the target (L2-028 AC2)', async () => {
    await controller.setManual(20);

    expect(setResistance).toHaveBeenCalledWith(20);
    expect(controller.target()).toBe(20);
    expect(controller.source()).toBe('manual');
  });

  it('applies the plan’s level again when the next segment starts (L2-028 AC3)', async () => {
    await controller.applyPlanLevel(12);
    await controller.setManual(18);

    await controller.applyPlanLevel(10);

    expect(controller.target()).toBe(10);
    expect(controller.source()).toBe('plan');
  });

  it('sends nothing by hand while the bike is away (L2-028 AC4)', async () => {
    await controller.applyPlanLevel(12);
    setResistance.mockClear();
    ble.set('disconnected');

    await controller.nudge(1);
    await controller.setManual(20);

    expect(setResistance).not.toHaveBeenCalled();
    expect(controller.target()).toBe(12);
    expect(controller.source()).toBe('plan');
  });

  it('logs each command the bike took at the ride clock’s second, newest first (L2-029 AC1)', async () => {
    TestBed.resetTestingModule();
    let now = 0;
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        RideClock,
        { provide: BIKE_CONNECTION, useValue: { ble, setResistance } },
        { provide: MONOTONIC_TIME, useValue: { now: () => now } },
      ],
    });
    const clock = TestBed.inject(RideClock);
    const logged = TestBed.inject(ResistanceController);
    clock.start();

    await logged.applyPlanLevel(8);
    now = 330_400;
    await logged.setManual(20);

    expect(logged.log()).toEqual([
      { rideTime: 330, level: 20, source: 'manual', ackMs: 30 },
      { rideTime: 0, level: 8, source: 'plan', ackMs: 30 },
    ]);
  });

  it('logs nothing the bike did not take', async () => {
    setResistance.mockRejectedValueOnce(new BikeConnectionError('failed', 'gone'));
    await controller.applyPlanLevel(8);
    expect(controller.log()).toEqual([]);
  });
});
