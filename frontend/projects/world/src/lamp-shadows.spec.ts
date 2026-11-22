import type { CourseLamps } from './course';
import { type LampShadow, lampShadows, RIDER_HEIGHT } from './lamp-shadows';

const lamps: CourseLamps = { every: 24, first: 0, across: 5, height: 6.5, colour: 0xffe2a8 };
const cast = (metres: number, lane: number): LampShadow[] =>
  lampShadows(lamps, metres, lane).filter((shadow) => shadow.strength > 0);

describe('lampShadows (L2-166 AC16)', () => {
  it('throws a shadow away from each lamp near the rider: two rows of lamps, one on each kerb', () => {
    expect(lampShadows(lamps, 6, 0)).toHaveLength(4);
  });

  it('points each shadow straight away from its lamp', () => {
    // Level with a row of lamps, on the centre line: one shadow to the left of the road, one to the right.
    const level = cast(24, 0).filter((shadow) => Math.abs(shadow.along) < 1e-9);
    expect(level.map((shadow) => Math.sign(shadow.across)).sort()).toEqual([-1, 1]);
    // Six metres past a row: its shadows point on up the road, the next row's back down it.
    const past = cast(30, 0);
    expect(past.filter((shadow) => shadow.along > 0)).toHaveLength(2);
    expect(past.filter((shadow) => shadow.along < 0)).toHaveLength(2);
  });

  it('makes a shadow as long as the lamp is low: the rider’s height over the lamp’s height above it', () => {
    // 5 m from each lamp of the row, on the centre line.
    const [shadow] = cast(24, 0);
    const length = Math.hypot(shadow!.along, shadow!.across);
    expect(length).toBeCloseTo((RIDER_HEIGHT * 5) / (6.5 - RIDER_HEIGHT));
  });

  it('makes the shadow of the nearer lamp the darker', () => {
    // Beside the right kerb's lamp: its shadow is short and dark, the far kerb's long and faint.
    const [near, far] = cast(24, 4).sort((a, b) => b.strength - a.strength);
    expect(near!.across).toBeLessThan(0);
    expect(far!.across).toBeGreaterThan(0);
    expect(near!.strength).toBeGreaterThan(far!.strength * 2);
  });

  it('never darkens the road more than a shadow can: all of them together stay under 1', () => {
    for (const metres of [0, 3, 6, 12, 18, 24]) {
      for (const lane of [-4, 0, 4]) {
        const total = cast(metres, lane).reduce((sum, shadow) => sum + shadow.strength, 0);
        expect(total).toBeLessThan(1);
        expect(total).toBeGreaterThan(0.2);
      }
    }
  });

  it('writes into the list it is given, so a frame allocates nothing', () => {
    const into = lampShadows(lamps, 0, 0);
    expect(lampShadows(lamps, 12, 1, into)).toBe(into);
  });
});
