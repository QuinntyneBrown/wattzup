import { describe, expect, it } from 'vitest';
import {
  type CableSpan,
  cablewaySlopeDegrees,
  chairliftLoopPosition,
  gondolaPosition,
} from './gondola-flight';

const SASS_PORDOI: CableSpan = {
  from: [0, 140, 0],
  to: [300, 585, -420],
  sag: 18,
  traverseSeconds: 40,
  dwellSeconds: 5,
};

describe('gondolaPosition', () => {
  it('starts at the lower station, dips by catenary sag at mid-span, and reaches the cliff station', () => {
    const start = gondolaPosition(SASS_PORDOI, 0);
    expect(start.x).toBeCloseTo(0, 3);
    expect(start.y).toBeCloseTo(140, 3);

    const mid = gondolaPosition(SASS_PORDOI, 20);
    expect(mid.x).toBeCloseTo(150, 3);
    expect(mid.y).toBeCloseTo((140 + 585) * 0.5 - 18, 3);

    const top = gondolaPosition(SASS_PORDOI, 42);
    expect(top.x).toBeCloseTo(300, 3);
    expect(top.y).toBeCloseTo(585, 3);
  });

  it('holds completely still when reducedMotion is enabled', () => {
    const a = gondolaPosition(SASS_PORDOI, 5, 0.25, true);
    const b = gondolaPosition(SASS_PORDOI, 37, 0.25, true);
    expect(b).toEqual(a);
    expect(b.sway).toBe(0);
  });

  it('circulates monocable carriers up one rope and down the parallel return rope', () => {
    const up = chairliftLoopPosition([0, 100, 0], [0, 200, -200], 2, 40, 10);
    const down = chairliftLoopPosition([0, 100, 0], [0, 200, -200], 2, 40, 30);
    expect(up.ascending).toBe(true);
    expect(down.ascending).toBe(false);
    expect(up.x).toBeCloseTo(-down.x, 3);
    expect(cablewaySlopeDegrees(SASS_PORDOI)).toBeGreaterThan(35);
  });
});
