import {
  PLANE_EVERY,
  PLANE_SEEN,
  planeFlight,
  planeLights,
  type PlanePlace,
  planeSize,
} from './plane-flight';

describe('an aeroplane on its way in to land, across the sky (L2-166 AC45)', () => {
  // The sun stands along +x: the aeroplane crosses in front of it, along z.
  const sun = [1, 0.2, 0] as const;
  const at = (time: number): PlanePlace | null => {
    const place: PlanePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, shown: 0 };
    return planeFlight(time, sun, place) ? place : null;
  };

  it('is in the sky when the ride starts, towards the sun and above it', () => {
    const place = at(0)!;
    expect(place.x).toBeGreaterThan(200);
    expect(place.y).toBeGreaterThan(40);
    expect(place.y).toBeLessThan(260);
  });

  it('crosses the sky square to the sun, at an airliner’s pace on its approach', () => {
    const a = at(2)!;
    const b = at(3)!;
    expect(b.x).toBeCloseTo(a.x);
    expect(Math.abs(b.z - a.z)).toBeGreaterThan(60);
    expect(Math.abs(b.z - a.z)).toBeLessThan(85);
  });

  it('comes down as it goes, a few degrees, its nose a little up', () => {
    const a = at(0)!;
    const b = at(10)!;
    const fell = (a.y - b.y) / Math.abs(b.z - a.z);
    expect(fell).toBeGreaterThan(0.02);
    expect(fell).toBeLessThan(0.07);
    expect(b.pitch).toBeGreaterThan(0);
    expect(b.pitch).toBeLessThan(0.1);
  });

  it('points its nose the way it flies', () => {
    const a = at(4)!;
    const b = at(5)!;
    // A heading turns the nose from +x round the upright: (cos, 0, -sin).
    expect(Math.cos(a.heading)).toBeCloseTo(0);
    expect(Math.sign(-Math.sin(a.heading))).toBe(Math.sign(b.z - a.z));
  });

  it('is gone once it has crossed, and another comes after a while', () => {
    expect(at(PLANE_SEEN + 1)).toBeNull();
    expect(at(PLANE_EVERY - 40)).toBeNull();
    const again = at(PLANE_EVERY + 4)!;
    const first = at(4)!;
    expect(again.z).toBeCloseTo(first.z);
    expect(again.y).toBeCloseTo(first.y);
  });

  it('flies the same way wherever the sun stands', () => {
    const place: PlanePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, shown: 0 };
    expect(planeFlight(0, [0, 0.2, -3], place)).toBe(true);
    expect(place.z).toBeLessThan(-200);
    expect(Math.hypot(place.x, place.z)).toBeCloseTo(Math.hypot(at(0)!.x, at(0)!.z));
  });
});

describe("the aeroplane's lights and how it comes out of the haze (L2-166 AC50)", () => {
  const sun = [1, 0.2, 0] as const;
  const place: PlanePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, shown: 0 };

  it('comes out of the haze as it nears and goes back into it as it leaves', () => {
    // The first is well on its way when the ride starts; the second is watched from where it comes into sight.
    const second = PLANE_EVERY - 12;
    expect(planeFlight(second, sun, place)).toBe(true);
    const faint = place.shown;
    expect(faint).toBeLessThan(0.3);
    planeFlight(second + 3, sun, place);
    expect(place.shown).toBeGreaterThan(faint);
    planeFlight(10, sun, place);
    expect(place.shown).toBe(1);
    planeFlight(PLANE_SEEN - 1, sun, place);
    expect(place.shown).toBeLessThan(0.3);
  });

  it('flashes its white strobes twice in quick succession, then waits', () => {
    const lit = (from: number, to: number): boolean[] => {
      const seen: boolean[] = [];
      for (let t = from; t < to; t += 0.01) seen.push(planeLights(t).strobe);
      return seen;
    };
    const second = lit(0, 1.1);
    const flashes = second.filter((on, i) => on && !second[i - 1]).length;
    expect(flashes).toBe(2);
    // Lit for a small part of the time: a flash, not a lamp.
    expect(second.filter(Boolean).length / second.length).toBeLessThan(0.2);
    expect(planeLights(0.7).strobe).toBe(false);
  });

  it('blinks its red beacon once a second, between the strobes', () => {
    let blinks = 0;
    let was = false;
    for (let t = 0; t < 3; t += 0.01) {
      const { beacon, strobe } = planeLights(t);
      if (beacon && !was) blinks++;
      if (beacon) expect(strobe).toBe(false);
      was = beacon;
    }
    expect(blinks).toBe(3);
  });
});

describe('the aeroplane in the evening air (L2-166 AC55)', () => {
  const sun = [1, 0.2, 0] as const;
  const place: PlanePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, shown: 0 };

  it('rocks its wings a little as it comes in, never more than a couple of degrees', () => {
    const rolls: number[] = [];
    for (let t = 0; t < 20; t += 0.25) {
      planeFlight(t, sun, place);
      rolls.push(place.roll);
    }
    expect(Math.max(...rolls)).toBeGreaterThan(0.01);
    expect(Math.min(...rolls)).toBeLessThan(-0.01);
    expect(Math.max(...rolls.map(Math.abs))).toBeLessThan(0.04);
    // Slowly: no more than a third of a degree from one quarter second to the next.
    for (let i = 1; i < rolls.length; i++)
      expect(Math.abs(rolls[i]! - rolls[i - 1]!)).toBeLessThan(0.006);
  });
});

describe('one aeroplane after another, no two arrivals alike (L2-166 AC109)', () => {
  it('is the size it was built for the first that crosses, and the same size all the way across', () => {
    expect(planeSize(0)).toBe(1);
    expect(planeSize(PLANE_SEEN - 1)).toBe(1);
  });

  it('is a smaller jet or a bigger one for those that come after: from three quarters to a third as big again', () => {
    const sizes = new Set<number>();
    for (let arrival = 0; arrival < 10; arrival++) {
      const early = planeSize(PLANE_SEEN + 5 + arrival * PLANE_EVERY);
      const late = planeSize(PLANE_SEEN + 40 + arrival * PLANE_EVERY);
      expect(early).toBe(late);
      expect(early).toBeGreaterThanOrEqual(0.75);
      expect(early).toBeLessThanOrEqual(1.34);
      sizes.add(early);
    }
    expect(sizes.size).toBeGreaterThanOrEqual(3);
  });

  it('is the same at the same second of every ride', () => {
    expect(planeSize(500)).toBe(planeSize(500));
  });
});
