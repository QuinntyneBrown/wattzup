import { FLOCK_EVERY, type FlockPlace, flockFlight } from './flock-flight';

describe('a flock of gulls crossing the sunset on its way to roost (L2-166 AC79)', () => {
  // The sun stands along +x: the flock crosses in front of it, along z.
  const sun = [1, 0.2, 0] as const;
  const at = (time: number): FlockPlace | null => {
    const place: FlockPlace = { x: 0, y: 0, z: 0, heading: 0, shown: 0 };
    return flockFlight(time, sun, place) ? place : null;
  };

  it('is low over the sea towards the sun, nearer and lower than the aeroplane', () => {
    const place = at(20)!;
    expect(place.x).toBeGreaterThan(80);
    expect(place.x).toBeLessThan(250);
    expect(place.y).toBeGreaterThan(15);
    expect(place.y).toBeLessThan(45);
  });

  it('flies at a gull’s pace, square to the sun, the other way to the aeroplane', () => {
    const a = at(20)!;
    const b = at(21)!;
    expect(b.x).toBeCloseTo(a.x);
    expect(Math.abs(b.z - a.z)).toBeGreaterThan(9);
    expect(Math.abs(b.z - a.z)).toBeLessThan(18);
    // The aeroplane flies towards +z with the sun along +x; the gulls come back the other way.
    expect(b.z).toBeLessThan(a.z);
    expect(Math.sign(-Math.sin(a.heading))).toBe(-1);
  });

  it('rises and falls a little as it goes, never by much from one second to the next', () => {
    const heights: number[] = [];
    for (let t = 10; t < 40; t++) heights.push(at(t)!.y);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(2);
    for (let i = 1; i < heights.length; i++)
      expect(Math.abs(heights[i]! - heights[i - 1]!)).toBeLessThan(2);
  });

  it('comes out of the distance and goes back into it, and another flock comes after a while', () => {
    let seen = 0;
    let faint = 0;
    for (let t = 0; t < FLOCK_EVERY; t += 0.5) {
      const place = at(t);
      if (!place) continue;
      seen++;
      if (place.shown < 0.5) faint++;
      expect(place.shown).toBeGreaterThanOrEqual(0);
      expect(place.shown).toBeLessThanOrEqual(1);
    }
    // In the sky for most of the time but not all of it, and faint only at the ends of its crossing.
    expect(seen / (FLOCK_EVERY * 2)).toBeGreaterThan(0.5);
    expect(seen / (FLOCK_EVERY * 2)).toBeLessThan(0.95);
    expect(faint / seen).toBeLessThan(0.25);
    expect(at(FLOCK_EVERY + 20)!.z).toBeCloseTo(at(20)!.z);
  });
});
