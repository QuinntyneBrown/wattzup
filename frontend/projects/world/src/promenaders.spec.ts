import { type Promenader, promenaders, STROLLERS } from './promenaders';

describe('people strolling along the seawall, a drink in hand (L2-166 AC80)', () => {
  const course = { end: 8434, half: 5 };
  const at = (time: number, rider: number): Promenader[] => {
    const out: Promenader[] = Array.from({ length: STROLLERS }, () => ({
      metres: 0,
      lane: 0,
      forward: true,
      shown: false,
      phase: 0,
    }));
    promenaders(time, rider, course.end, course.half, out);
    return out;
  };

  it('walk at a stroll along the course, some each way, whatever the rider does', () => {
    const before = at(100, 3000);
    const after = at(101, 3000);
    const ways = new Set<boolean>();
    for (let i = 0; i < STROLLERS; i++) {
      const moved = after[i]!.metres - before[i]!.metres;
      // A stroll: between 1 and 1.7 metres a second, up the course or down it.
      expect(Math.abs(moved)).toBeGreaterThan(1);
      expect(Math.abs(moved)).toBeLessThan(1.7);
      expect(moved > 0).toBe(before[i]!.forward);
      ways.add(before[i]!.forward);
    }
    expect(ways.size).toBe(2);
  });

  it('are on the sidewalk by the seawall, left of the road and clear of its kerb', () => {
    for (const one of at(40, 2000)) {
      expect(one.lane).toBeLessThan(-(course.half + 1.2));
      expect(one.lane).toBeGreaterThan(-(course.half + 2.2));
    }
  });

  it('are always somewhere the rider can see: from just behind to a couple of hundred metres ahead', () => {
    for (const rider of [500, 2500, 6000]) {
      for (let time = 0; time < 400; time += 7) {
        for (const one of at(time, rider)) {
          expect(one.metres).toBeGreaterThanOrEqual(rider - 60);
          expect(one.metres).toBeLessThan(rider + 200);
        }
      }
    }
  });

  it('are not all in one place', () => {
    const where = at(10, 4000).map((one) => one.metres);
    expect(Math.max(...where) - Math.min(...where)).toBeGreaterThan(60);
  });

  it('keep off the start line and out of the finish crowd', () => {
    expect(at(5, 8300).every((one) => !one.shown)).toBe(true);
    expect(at(5, 0).some((one) => one.metres < 30 && one.shown)).toBe(false);
    expect(at(5, 3000).every((one) => one.shown)).toBe(true);
  });

  it('step as fast as they walk: two steps for every 1.12 m, so their feet do not slide', () => {
    const before = at(100, 3000);
    const after = at(100.5, 3000);
    for (let i = 0; i < STROLLERS; i++) {
      const walked = Math.abs(after[i]!.metres - before[i]!.metres);
      const turned = after[i]!.phase - before[i]!.phase;
      expect(turned).toBeCloseTo((walked / 1.12) * Math.PI * 2, 6);
    }
    // And they are not in step with each other.
    const now = at(0, 3000).map((one) => one.phase % (Math.PI * 2));
    expect(new Set(now.map((p) => p.toFixed(2))).size).toBe(STROLLERS);
  });

  it('are where they were at the same second and the same place of every ride', () => {
    expect(at(77.5, 1234)).toEqual(at(77.5, 1234));
  });
});
