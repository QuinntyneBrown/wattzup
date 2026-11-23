import { describe, expect, it } from 'vitest';
import { enrosadiraTint } from './enrosadira';

describe('enrosadiraTint', () => {
  it('progresses from pale dolomite through peak coral-rose (r > g > b) into violet twilight', () => {
    const day = enrosadiraTint(0);
    const rose = enrosadiraTint(0.7);
    const dusk = enrosadiraTint(1);
    expect(rose.r).toBeGreaterThan(day.r);
    expect(rose.r).toBeGreaterThan(rose.g);
    expect(dusk.b).toBeGreaterThan(dusk.g);
  });
});
