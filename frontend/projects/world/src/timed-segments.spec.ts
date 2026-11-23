import { timedSegments } from './timed-segments';

describe('timedSegments (ADR 0030)', () => {
  it('starts each segment where the one before it ends', () => {
    expect(
      timedSegments([
        { kind: 'warm-up', duration: 300, level: 8, cadenceAim: 85 },
        { kind: 'work', duration: 30, level: 24, cadenceAim: 100 },
        { kind: 'recover', duration: 60, level: 10, cadenceAim: 80 },
      ]).map((s) => s.start),
    ).toEqual([0, 300, 330]);
  });

  it('times no segments for an empty plan', () => {
    expect(timedSegments([])).toEqual([]);
  });
});
