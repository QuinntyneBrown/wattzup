import { estimateFramePeriod } from './frame-period';

/** `n` intervals of `ms`, after a long first one that is always left out. */
const steady = (ms: number, n = 30) => [250, ...Array.from({ length: n }, () => ms)];

describe('estimateFramePeriod (L2-111 AC9)', () => {
  it.each([
    ['30 Hz', 33.4, 1000 / 30],
    ['60 Hz', 16.6, 1000 / 60],
    ['120 Hz', 8.4, 1000 / 120],
    ['144 Hz', 6.95, 1000 / 144],
  ])('measures %s', (_, ms, period) => {
    expect(estimateFramePeriod(steady(ms))).toBeCloseTo(period, 6);
  });

  it('snaps jittery intervals to the nearest common rate', () => {
    const jitter = [0, 250, ...Array.from({ length: 30 }, (_, i) => 16.7 + (i % 2 ? 1.4 : -1.2))];
    expect(estimateFramePeriod(jitter)).toBeCloseTo(1000 / 60, 6);
  });

  it('leaves out the first interval and gaps over 100 ms', () => {
    const gappy = [5, ...Array.from({ length: 30 }, (_, i) => (i % 3 === 0 ? 400 : 33.3))];
    expect(estimateFramePeriod(gappy)).toBeCloseTo(1000 / 30, 6);
  });

  it.each([
    ['no intervals', []],
    ['nine usable intervals', steady(33.3, 9)],
    ['only gaps', steady(500)],
  ])('falls back to 60 Hz with %s', (_, intervals) => {
    expect(estimateFramePeriod(intervals)).toBeCloseTo(1000 / 60, 6);
  });
});
