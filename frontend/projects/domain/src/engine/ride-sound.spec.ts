// Unit test
// Traces to: L2-163 AC1
// Description: ride sound's rules, `main`'s with their cases: the chain ticks with the cadence and is louder with
// resistance, the freewheel runs down over 3 s from the last speed, wind and tyres rise with speed, the volume scales
// every voice, and a closed gate silences them all.
import { nextFreewheel, type RideSoundInput, rideSoundParams } from './ride-sound';

/** A running moment at full volume; each case changes what it is about. */
const moment = (change: Partial<RideSoundInput> = {}): RideSoundInput => ({
  cadence: 90,
  speedKmh: 33.7,
  resistance: 32,
  audible: true,
  volume: 1,
  freewheel: null,
  now: 0,
  ...change,
});

describe('rideSoundParams (L2-163)', () => {
  describe('chain: one tick per pedal stroke', () => {
    it.each([
      [0, 0],
      [60, 2],
      [90, 3],
      [120, 4],
    ])('ticks %d rpm at %d a second', (cadence, ticks) => {
      expect(rideSoundParams(moment({ cadence })).chain.ticksPerSecond).toBeCloseTo(ticks, 9);
    });

    it('does not tick with no cadence reported', () => {
      expect(rideSoundParams(moment({ cadence: null })).chain.ticksPerSecond).toBe(0);
    });
  });

  describe('chain: louder with resistance', () => {
    it.each([
      [1, 0.25],
      [18, 0.25 + (0.75 * 17) / 31],
      [32, 1],
    ])('at level %d is %f of the volume', (resistance, share) => {
      expect(rideSoundParams(moment({ resistance, volume: 0.6 })).chain.gain).toBeCloseTo(
        0.6 * share,
        9,
      );
    });

    it('is a quarter of the volume while resistance is null', () => {
      expect(rideSoundParams(moment({ resistance: null, volume: 0.6 })).chain.gain).toBeCloseTo(
        0.15,
        9,
      );
    });

    it('is silent while the chain does not tick', () => {
      expect(rideSoundParams(moment({ cadence: 0 })).chain.gain).toBe(0);
    });
  });

  describe('freewheel: runs down over 3 s from the last speed', () => {
    const from = { fromKmh: 33.7, startedAt: 10_000 };
    it.each([
      [0, 33.7, 0.5],
      [1500, 16.85, 0.25],
      [3000, 0, 0],
      [4000, 0, 0],
    ])('%d ms in, clicks %f a second at %f of the volume', (ms, clicks, gain) => {
      const p = rideSoundParams(moment({ cadence: 0, freewheel: from, now: from.startedAt + ms }));
      expect(p.freewheel.clicksPerSecond).toBeCloseTo(clicks, 9);
      expect(p.freewheel.gain).toBeCloseTo(gain, 9);
    });

    it('is silent with no freewheel running', () => {
      expect(rideSoundParams(moment()).freewheel).toEqual({ clicksPerSecond: 0, gain: 0 });
    });
  });

  describe('wind and tyre: rise with speed', () => {
    it.each([
      // speed, wind cutoff, wind gain, tyre centre, tyre gain
      [0, 300, 0, 150, 0],
      [20, 1100, 0.24, 350, 0.15],
      [33.7, 1648, 0.4044, 487, 0.25275],
      [60, 2700, 0.6, 750, 0.3],
    ])('at %f km/h', (speedKmh, cutoffHz, windGain, centreHz, tyreGain) => {
      const p = rideSoundParams(moment({ speedKmh }));
      expect(p.wind.cutoffHz).toBeCloseTo(cutoffHz, 9);
      expect(p.wind.gain).toBeCloseTo(windGain, 9);
      expect(p.tyre.centreHz).toBeCloseTo(centreHz, 9);
      expect(p.tyre.gain).toBeCloseTo(tyreGain, 9);
    });

    it('rises as the speed rises from 10 to 35 km/h', () => {
      const slow = rideSoundParams(moment({ speedKmh: 10 }));
      const fast = rideSoundParams(moment({ speedKmh: 35 }));
      expect(fast.wind.cutoffHz).toBeGreaterThan(slow.wind.cutoffHz);
      expect(fast.wind.gain).toBeGreaterThan(slow.wind.gain);
      expect(fast.tyre.centreHz).toBeGreaterThan(slow.tyre.centreHz);
      expect(fast.tyre.gain).toBeGreaterThan(slow.tyre.gain);
    });

    it('is silent with no speed reported', () => {
      const p = rideSoundParams(moment({ speedKmh: null }));
      expect([p.wind.gain, p.tyre.gain]).toEqual([0, 0]);
    });
  });

  it('scales every voice with the volume', () => {
    const loud = rideSoundParams(moment({ volume: 1 }));
    const quiet = rideSoundParams(moment({ volume: 0.5 }));
    expect(quiet.chain.gain).toBeCloseTo(loud.chain.gain / 2, 9);
    expect(quiet.wind.gain).toBeCloseTo(loud.wind.gain / 2, 9);
    expect(quiet.tyre.gain).toBeCloseTo(loud.tyre.gain / 2, 9);
  });

  // Paused, hidden, the bike lost or a class video playing over it all close the gate.
  it('silences every voice while not audible, keeping the rates', () => {
    const p = rideSoundParams(
      moment({ audible: false, freewheel: { fromKmh: 30, startedAt: 0 }, now: 0 }),
    );
    expect([p.chain.gain, p.freewheel.gain, p.wind.gain, p.tyre.gain]).toEqual([0, 0, 0, 0]);
    expect(p.chain.ticksPerSecond).toBeCloseTo(3, 9);
  });
});

describe('nextFreewheel (L2-163)', () => {
  it('starts from the last speed when the cadence falls to 0', () => {
    expect(nextFreewheel(null, { previousCadence: 90, cadence: 0, lastKmh: 33.7, now: 5 })).toEqual(
      { fromKmh: 33.7, startedAt: 5 },
    );
  });

  it('holds while the cadence stays at 0', () => {
    const running = { fromKmh: 33.7, startedAt: 5 };
    expect(
      nextFreewheel(running, { previousCadence: 0, cadence: 0, lastKmh: 33.7, now: 2000 }),
    ).toBe(running);
  });

  it('runs out 3 s after it started', () => {
    const running = { fromKmh: 33.7, startedAt: 5 };
    expect(
      nextFreewheel(running, { previousCadence: 0, cadence: 0, lastKmh: 33.7, now: 3005 }),
    ).toBeNull();
  });

  it('stops when the cadence rises again', () => {
    const running = { fromKmh: 33.7, startedAt: 5 };
    expect(
      nextFreewheel(running, { previousCadence: 0, cadence: 40, lastKmh: 15, now: 900 }),
    ).toBeNull();
  });

  it('does not start from a standstill or with no cadence known', () => {
    expect(nextFreewheel(null, { previousCadence: 0, cadence: 0, lastKmh: 0, now: 1 })).toBeNull();
    expect(
      nextFreewheel(null, { previousCadence: null, cadence: 0, lastKmh: 20, now: 1 }),
    ).toBeNull();
  });
});
