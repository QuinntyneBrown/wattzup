import {
  APEX_MIN,
  apexes,
  BEND_SAMPLES,
  bendAhead,
  bendPoint,
  curvature,
  EASE_FROM,
  EASE_TO,
  lean,
  racingLine,
  squeeze,
} from './scene-bend';
import { WORLDS, worldById, type World } from './worlds';

const alpe = worldById('alpe');
const straight: World = { ...alpe, bend: { angle: 0, length: 100 } };
const distance = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z);

describe('bendAhead and bendPoint (L2-101 AC6, L2-110 AC9)', () => {
  it('samples 128 points of centre, heading and curvature', () => {
    expect(bendAhead(alpe, 1234)).toHaveLength(BEND_SAMPLES * 4);
  });

  it('keeps the road under the rider at (0, 0), pointing straight down the view', () => {
    for (const s of [0, 777, 4321]) {
      const samples = bendAhead(alpe, s);
      expect(distance(bendPoint(samples, 0, 0), { x: 0, z: 0 })).toBeLessThan(1e-6);
      expect(distance(bendPoint(samples, 3, 0), { x: 3, z: 0 })).toBeLessThan(1e-6);
      expect(distance(bendPoint(samples, 0, -2), { x: 0, z: -2 })).toBeLessThan(0.05);
    }
  });

  it('leaves the road of a scene with no bend straight', () => {
    const samples = bendAhead(straight, 999);
    for (const x of [-300, -6, 0, 4, 250]) {
      for (const z of [60, 5, 0, -50, -299, -800]) {
        expect(distance(bendPoint(samples, x, z), { x, z })).toBeLessThan(1e-6);
      }
    }
  });

  it('turns the road ahead by the heading of L2-101 AC6, from the heading under the rider', () => {
    const s = 1500;
    const samples = bendAhead(alpe, s);
    const turn = ((alpeHeading(s + 100) - alpeHeading(s)) * Math.PI) / 180;
    const a = bendPoint(samples, 0, -99);
    const b = bendPoint(samples, 0, -101);
    const along = Math.atan2(b.x - a.x, -(b.z - a.z));
    expect(along).toBeCloseTo(turn, 2);
  });

  it('keeps a point on the outside of a bend its distance from the centre line, and one inside no further', () => {
    for (const s of [300, 900, 2500]) {
      const samples = bendAhead(alpe, s);
      for (const m of [40, 120, 220]) {
        const centre = bendPoint(samples, 0, -m);
        for (const x of [-8, -3, 3, 8]) {
          const d = distance(bendPoint(samples, x, -m), centre);
          expect(d).toBeLessThanOrEqual(Math.abs(x) + 1e-6);
          expect(d).toBeGreaterThan(Math.abs(x) * 0.85);
        }
      }
    }
  });

  it('moves little from one frame to the next', () => {
    for (const world of WORLDS) {
      for (const s of [0, 1000, 5000]) {
        const now = bendAhead(world, s);
        const next = bendAhead(world, s + 0.01);
        for (const m of [-40, 0, 100, 300, 460, 2000]) {
          for (const x of [-200, -10, 0, 10, 200]) {
            const d = distance(bendPoint(now, x, -m), bendPoint(next, x, -m));
            expect(d).toBeLessThan(0.2);
          }
        }
      }
    }
  });

  it('eases the heading to 0 past the end of the road, so the far distance is only shifted', () => {
    const samples = bendAhead(alpe, 2222);
    expect(samples[(BEND_SAMPLES - 1) * 4 + 2]).toBeCloseTo(0, 9);
    const a = bendPoint(samples, 0, -1000);
    const b = bendPoint(samples, 50, -1500);
    expect(b.x - a.x).toBeCloseTo(50, 6);
    expect(b.z - a.z).toBeCloseTo(-500, 6);
  });

  it.each(WORLDS.map((w) => [w.id, w] as const))(
    '%s never folds the ground within 400 m of the road back over it',
    (_id, world) => {
      for (const s of [0, 640, 1990, 7300]) {
        const samples = bendAhead(world, s);
        for (let m = -40; m <= 460; m += 6) {
          for (let x = -400; x <= 400; x += 12) {
            const p = bendPoint(samples, x, -m);
            const dx = bendPoint(samples, x + 0.5, -m);
            const dm = bendPoint(samples, x, -m - 0.5);
            // The map's Jacobian keeps the sign it has on the straight road, where across is
            // +x and along is −z: x × (−z) < 0.
            const ax = { x: dx.x - p.x, z: dx.z - p.z };
            const am = { x: dm.x - p.x, z: dm.z - p.z };
            expect(ax.x * am.z - ax.z * am.x).toBeLessThan(0);
          }
        }
      }
    },
  );
});

describe('lean (L2-110 AC9)', () => {
  it('stands a rider upright on a straight road and when stopped', () => {
    expect(lean(straight, 1234, 12)).toBe(0);
    expect(lean(alpe, 1234, 0)).toBe(0);
  });

  it('leans into the bend: right on a right-hander, left on a left-hander', () => {
    for (const s of [100, 450, 1700, 3300]) {
      const k = curvature(alpe, s);
      expect(Math.sign(lean(alpe, s, 9))).toBe(Math.sign(k));
    }
  });

  it('balances gravity against the turn, atan(v² κ / g)', () => {
    const s = 1500;
    const k = ((alpeHeading(s + 0.5) - alpeHeading(s - 0.5)) * Math.PI) / 180;
    expect(lean(alpe, s, 10)).toBeCloseTo(Math.atan((100 * k) / 9.81), 9);
  });
});

describe('squeeze (L2-110 AC9)', () => {
  // A bend of radius 100 m: the inside keeps its distances to 50 m, then eases towards 85 m.
  const k = 0.01;
  const room = (EASE_TO - EASE_FROM) / k;
  const cases: [string, number, number, number][] = [
    ['on a straight road', 300, 0, 1],
    ['on the outside of a bend', -300, k, 1],
    ['on the inside, within half the radius', 40, k, 1],
    ['on the inside, at half the radius', 50, k, 1],
    ['on the inside, a room past half the radius', 50 + room, k, Math.exp(-1)],
    ['on the inside of a left-hander, a room past half the radius', -50 - room, -k, Math.exp(-1)],
  ];
  for (const [where, x, curve, expected] of cases) {
    it(`keeps ${expected === 1 ? 'the whole' : 'a share'} of the relief ${where}`, () => {
      expect(squeeze(x, curve)).toBeCloseTo(expected, 9);
    });
  }

  it('squeezes the relief as much as the ground, so no slope becomes a wall', () => {
    // The squeeze is the slope of the eased distance across: d(eased)/dx.
    const x = 70;
    const a = bendPoint(flatAt(k), x - 0.001, -100);
    const b = bendPoint(flatAt(k), x + 0.001, -100);
    const across = Math.hypot(b.x - a.x, b.z - a.z) / 0.002;
    expect(squeeze(x, k)).toBeCloseTo(across, 4);
  });
});

/** Samples of a road bending at curvature `k` everywhere, heading straight ahead at 0. */
function flatAt(k: number): Float32Array {
  const samples = new Float32Array(BEND_SAMPLES * 4);
  for (let i = 0; i < BEND_SAMPLES; i++) {
    samples[i * 4 + 1] = 40 - i * 4;
    samples[i * 4 + 3] = k;
  }
  return samples;
}

describe('racingLine (L2-107 AC7, L2-110 AC9)', () => {
  it('keeps a rider in their lane on a straight road', () => {
    for (const lane of [-1.7, 0, 1.5]) expect(racingLine(straight, 4321, lane, 3.5)).toBe(lane);
  });

  it('draws a rider to the inside of a bend: right on a right-hander', () => {
    for (const s of [100, 450, 1700, 3300]) {
      const k = curvature(alpe, s);
      expect(Math.sign(racingLine(alpe, s, 0, 3.5))).toBe(Math.sign(k));
    }
  });

  it('never rides into the gutter', () => {
    for (let s = 0; s < 3000; s += 37) {
      for (const lane of [-2, 0, 2]) {
        expect(Math.abs(racingLine(alpe, s, lane, 3.5))).toBeLessThanOrEqual(2.6 + 1e-9);
      }
    }
  });
});

describe('apexes (L2-110 AC9)', () => {
  const oldtown = worldById('oldtown');

  it('finds no corner on a straight road', () => {
    expect(apexes(straight, 0, 5000)).toEqual([]);
  });

  it('marks each bend where it turns hardest, and which way', () => {
    const found = apexes(oldtown, 0, 3000);
    expect(found.length).toBeGreaterThan(4);
    for (const apex of found) {
      const k = curvature(oldtown, apex.s);
      expect(Math.abs(k)).toBeGreaterThanOrEqual(APEX_MIN);
      expect(Math.abs(k)).toBeGreaterThanOrEqual(Math.abs(curvature(oldtown, apex.s - 2)));
      expect(Math.abs(k)).toBeGreaterThanOrEqual(Math.abs(curvature(oldtown, apex.s + 2)));
      expect(apex.turn).toBe(k > 0 ? 1 : -1);
    }
  });

  it('lists them nearest first, within the stretch asked for', () => {
    const found = apexes(oldtown, 400, 1600);
    expect(found.every((a) => a.s >= 400 && a.s <= 1600)).toBe(true);
    expect(found.map((a) => a.s)).toEqual([...found.map((a) => a.s)].sort((a, b) => a - b));
  });

  it('finds the same corner wherever the search starts', () => {
    const whole = apexes(oldtown, 0, 3000).map((a) => a.s);
    for (const from of [101, 555, 1234]) {
      const part = apexes(oldtown, from, 3000).map((a) => a.s);
      expect(part).toEqual(whole.filter((s) => s >= from));
    }
  });

  it('stops after the requested limit of nearest apexes', () => {
    const whole = apexes(oldtown, 0, 3000);
    expect(whole.length).toBeGreaterThan(4);
    expect(apexes(oldtown, 0, 3000, 3)).toEqual(whole.slice(0, 3));
  });
});

function alpeHeading(s: number): number {
  const { angle, length } = alpe.bend;
  return angle * Math.sin(s / length) * Math.cos(s / (2.7 * length) + 1);
}
