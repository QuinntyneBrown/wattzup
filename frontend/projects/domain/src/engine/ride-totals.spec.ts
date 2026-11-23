// Unit test (the slice's acceptance table: no screen shows totals until slice 5.2)
// Traces to: L2-022 AC2, AC3; L2-023 AC4, AC5; L2-024
// Description: each running second adds speed ÷ 3600 to distance and power ÷ 1000 to output; average power and
// energy follow from them; a paused ride has no running seconds, so its totals hold. A fake BikeTelemetry gives the
// live speed and power, and the simulated bike runs the path end to end.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BIKE_CONNECTION, TICKER } from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { EnergyModel } from './energy-model';
import { RideTotals } from './ride-totals';

describe('RideTotals', () => {
  const speedKmh = signal<number | null>(null);
  const powerW = signal<number | null>(null);
  let totals: RideTotals;

  const ride = (seconds: number) => {
    for (let second = 0; second < seconds; second++) totals.onRunningSecond();
  };

  beforeEach(() => {
    speedKmh.set(null);
    powerW.set(null);
    TestBed.configureTestingModule({
      providers: [RideTotals, { provide: BikeTelemetry, useValue: { speedKmh, powerW } }],
    });
    totals = TestBed.inject(RideTotals);
  });

  it('starts at zero, with no average power', () => {
    expect([
      totals.runningSeconds(),
      totals.distanceKm(),
      totals.outputKj(),
      totals.energyKcal(),
    ]).toEqual([0, 0, 0, 0]);
    expect(totals.avgPowerW()).toBeNull();
  });

  it('adds speed in km/h ÷ 3600 to distance each running second (L2-022 AC2)', () => {
    speedKmh.set(30);
    ride(1);
    expect(totals.distanceKm()).toBeCloseTo(30 / 3600, 10);

    ride(3599);
    expect(totals.distanceKm()).toBeCloseTo(30, 9);
  });

  it('holds distance while the ride is paused: no running seconds, however long (L2-022 AC3)', () => {
    speedKmh.set(30);
    ride(60);
    const before = totals.distanceKm();

    speedKmh.set(35);

    expect(totals.distanceKm()).toBe(before);
    expect(totals.runningSeconds()).toBe(60);
  });

  it('adds the second’s power ÷ 1000 to output in kJ (L2-023 AC5)', () => {
    powerW.set(200);
    ride(10);
    powerW.set(300);
    ride(1);

    expect(totals.outputKj()).toBeCloseTo(2.3, 10);
  });

  it('shows average power 208 W after 760 running seconds as 157 kcal (L2-023 AC4)', () => {
    powerW.set(208);
    ride(760);

    expect(totals.avgPowerW()).toBeCloseTo(208, 9);
    expect(totals.energyKcal()).toBe(157);
  });

  it('adds nothing for a second with unknown speed or power, but counts the second', () => {
    speedKmh.set(30);
    powerW.set(200);
    ride(10);
    speedKmh.set(null);
    powerW.set(null);
    ride(10);

    expect(totals.distanceKm()).toBeCloseTo(10 * (30 / 3600), 10);
    expect(totals.outputKj()).toBeCloseTo(2, 10);
    expect(totals.avgPowerW()).toBeCloseTo(100, 9);
    expect(totals.runningSeconds()).toBe(20);
  });
});

describe('RideTotals on the simulated bike', () => {
  it('turns the simulated Echelon’s frames into distance, output and energy (L2-024)', async () => {
    const second = new Subject<number>();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RideTotals,
        BikeTelemetry,
        SimulatedBikeConnection,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    const totals = TestBed.inject(RideTotals);
    await bike.requestBike();
    await bike.connect();
    await bike.setResistance(14);

    let expectedKm = 0;
    let expectedKj = 0;
    for (let s = 0; s < 60; s++) {
      second.next(s);
      expectedKm += (telemetry.speedKmh() ?? 0) / 3600;
      expectedKj += (telemetry.powerW() ?? 0) / 1000;
      totals.onRunningSecond();
    }

    expect(totals.distanceKm()).toBeGreaterThan(0);
    expect(totals.distanceKm()).toBeCloseTo(expectedKm, 10);
    expect(totals.outputKj()).toBeCloseTo(expectedKj, 10);
    expect(totals.energyKcal()).toBe(EnergyModel.kcal(totals.avgPowerW() ?? 0, 60));
    TestBed.resetTestingModule();
  });
});
