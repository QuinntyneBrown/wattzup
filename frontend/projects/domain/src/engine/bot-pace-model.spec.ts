// Unit test
// Traces to: L2-067 AC1; L2-123 AC4
// Description: each bot rides around the pack strength, with its own steady drift and swing, and the same map and
// pack draw the same paces.
import { BOT_NAMES, BotPaceModel, PACK_BASE_WATTS } from './bot-pace-model';

describe('BotPaceModel', () => {
  it.each([
    ['easy', 130],
    ['medium', 190],
    ['hard', 250],
  ] as const)('rides the %s pack around %d W', (pack, base) => {
    expect(PACK_BASE_WATTS[pack]).toBe(base);
    const paces = BotPaceModel.paces('old-town-criterium', pack);
    expect(paces.map((pace) => pace.name)).toEqual([...BOT_NAMES]);
    for (const pace of paces) {
      expect(Math.abs(pace.drift)).toBeLessThanOrEqual(0.12 * base);
      expect(pace.swing).toBeGreaterThanOrEqual(0.04 * base);
      expect(pace.swing).toBeLessThanOrEqual(0.1 * base);
      expect(pace.period).toBeGreaterThanOrEqual(45);
      expect(pace.period).toBeLessThanOrEqual(150);
      for (let t = 0; t < 600; t += 7) {
        const watts = BotPaceModel.watts(pace, t);
        expect(watts).toBeGreaterThanOrEqual(base * 0.78);
        expect(watts).toBeLessThanOrEqual(base * 1.22);
      }
    }
  });

  it('gives each bot its own drift', () => {
    const drifts = BotPaceModel.paces('old-town-criterium', 'medium').map((pace) => pace.drift);
    expect(new Set(drifts).size).toBe(9);
  });

  it('draws the same paces for the same map and pack, and others for another', () => {
    expect(BotPaceModel.paces('dolomites', 'hard')).toEqual(
      BotPaceModel.paces('dolomites', 'hard'),
    );
    expect(BotPaceModel.paces('dolomites', 'hard')).not.toEqual(
      BotPaceModel.paces('dolomites', 'easy'),
    );
    expect(BotPaceModel.paces('dolomites', 'hard')).not.toEqual(
      BotPaceModel.paces('vice-city', 'hard'),
    );
  });

  // The service rides a group session's bots on its own copy (Telo.Ride.Domain.Bots.BotPaceModel); BotPaceModelTests
  // runs this same table, so the two stay equal (L2-123 AC4).
  it.each([
    ['dolomites', 'hard', 0, 0, 229.829039],
    ['dolomites', 'hard', 3, 17, 264.577138],
    ['dolomites', 'hard', 8, 599, 261.017859],
    ['hiit-cardio-30@20261121T0730Z', 'easy', 0, 0, 126.067407],
    ['hiit-cardio-30@20261121T0730Z', 'easy', 3, 17, 112.148245],
    ['hiit-cardio-30@20261121T0730Z', 'easy', 8, 599, 127.386707],
  ] as const)(
    'draws for "%s" %s bot %d at %ds the power the service draws',
    (seed, pack, bot, t, watts) => {
      expect(BotPaceModel.watts(BotPaceModel.paces(seed, pack)[bot]!, t)).toBeCloseTo(watts, 6);
    },
  );

  it('swings each bot around its drift', () => {
    const pace = { name: 'Nova' as const, base: 190, drift: 10, swing: 15, period: 60, phase: 0 };
    expect(BotPaceModel.watts(pace, 0)).toBeCloseTo(200, 9);
    expect(BotPaceModel.watts(pace, 15)).toBeCloseTo(215, 9);
    expect(BotPaceModel.watts(pace, 45)).toBeCloseTo(185, 9);
  });
});
