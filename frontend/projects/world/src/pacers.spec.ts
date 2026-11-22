import { formatGap, PACERS, pacerBoard, pacerGap, pacersOnRoad } from './pacers';

const byName = (name: string) => PACERS.find((p) => p.name === name)!;

// L2-107 AC2: base + amp × sin(t ÷ period + phase), one case per row, at t 300.
describe('pacerGap (L2-107)', () => {
  it.each([
    ['Maya Okafor', 64.011],
    ['Jonas Lindqvist', 6.0319],
    ['Ana Ferreira', -22.4774],
    ['Kenji Watanabe', -69.1662],
    ['Sophie Dubois', 90.8266],
    ['Ravi Patel', -66.9865],
  ])('%s is %d m ahead at t 300', (name, metres) => {
    expect(pacerGap(byName(name), 300)).toBeCloseTo(metres, 3);
  });
});

describe('formatGap', () => {
  it.each([
    [0, '+0:00'],
    [12.002, '+0:12'],
    [-4.215, '−0:04'],
    [72.5, '+1:13'],
    [-0.4, '+0:00'],
  ])('writes %d s as %s', (seconds, text) => {
    expect(formatGap(seconds)).toBe(text);
  });
});

describe('pacerBoard (L2-107)', () => {
  it('lists the pacers and You from furthest ahead, as the default mock', () => {
    expect(pacerBoard(300, 19.2)).toEqual([
      { name: 'Sophie Dubois', jersey: 1, timeGap: '+0:17', you: false },
      { name: 'Maya Okafor', jersey: 2, timeGap: '+0:12', you: false },
      { name: 'Jonas Lindqvist', jersey: 3, timeGap: '+0:01', you: false },
      { name: 'You', jersey: 4, timeGap: null, you: true },
      { name: 'Ana Ferreira', jersey: 5, timeGap: '−0:04', you: false },
      { name: 'Ravi Patel', jersey: 6, timeGap: '−0:13', you: false },
      { name: 'Kenji Watanabe', jersey: 7, timeGap: '−0:13', you: false },
    ]);
  });

  it.each([0, null])('floors the speed at 3 m/s at %s km/h', (speed) => {
    const maya = pacerBoard(300, speed).find((r) => r.name === 'Maya Okafor');
    // 64.0 m ÷ 3 m/s = 21.3 s
    expect(maya?.timeGap).toBe('+0:21');
  });
});

// L2-107 AC7: the pacers from 4 m behind to 300 m ahead ride in the scene, each on its own line.
describe('pacersOnRoad (L2-107)', () => {
  it('places the pacers in view at their gaps, at t 300', () => {
    const riders = pacersOnRoad(300, 300);
    expect(riders.map((r) => r.jersey)).toEqual([1, 2, 3]);
    expect(riders.map((r) => r.metres)).toEqual([
      expect.closeTo(90.8266, 3),
      expect.closeTo(64.011, 3),
      expect.closeTo(6.0319, 3),
    ]);
  });

  it('draws a pacer alongside, and none past the end of the road in view, at t 0', () => {
    const riders = pacersOnRoad(0, 40);
    expect(riders.map((r) => [r.jersey, Math.round(r.metres)])).toEqual([
      [3, 30],
      [5, 1],
    ]);
  });

  it('gives each pacer its own line across the road, clear of the rider', () => {
    const ahead = PACERS.map((p) => ({ ...p, base: 10, amp: 0 }));
    const lanes = ahead.map((p) => pacersOnRoad(0, 300, [p])[0]!.lane);
    expect(new Set(lanes).size).toBe(PACERS.length);
    for (const lane of lanes) expect(Math.abs(lane)).toBeGreaterThanOrEqual(0.8);
  });

  it('reuses a caller-supplied output array in place across frames without allocating', () => {
    const out = [] as ReturnType<typeof pacersOnRoad>;
    const r0 = pacersOnRoad(0, 300, PACERS, out);
    expect(r0).toBe(out);
    expect(r0).toEqual(pacersOnRoad(0, 300));
    const r300 = pacersOnRoad(300, 300, PACERS, out);
    expect(r300).toBe(out);
    expect(r300).toEqual(pacersOnRoad(300, 300));
  });
});
