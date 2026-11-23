import { type Dusk, dusk } from './dusk';

describe('the evening drawing in over a ride into the sunset (L2-166 AC64)', () => {
  const at = (ridden: number): Dusk => dusk(ridden, { sky: [1, 1, 1], light: 1, stars: 0, sun: 0 });

  it('starts earlier in the evening: the sky lighter and more golden, the sun stronger', () => {
    const start = at(0);
    expect(start.sky[0]).toBeGreaterThan(1);
    expect(start.sky[0] - start.sky[2]).toBeGreaterThan(0.1);
    expect(start.light).toBeGreaterThan(1);
  });

  it('is the sky as it was painted three quarters of the way round', () => {
    const painted = at(0.75);
    for (const part of painted.sky) expect(part).toBeCloseTo(1, 2);
    expect(painted.light).toBeCloseTo(1, 2);
  });

  it('is deeper and redder at the finish, the sun weaker', () => {
    const end = at(1);
    expect(end.sky[0]).toBeLessThan(1);
    expect(end.sky[1]).toBeLessThan(end.sky[0]);
    expect(end.light).toBeLessThan(1);
    expect(end.light).toBeGreaterThan(0.7);
  });

  it('never brightens as the ride goes on, and never jumps', () => {
    let last = at(0);
    for (let ridden = 0.01; ridden <= 1.0001; ridden += 0.01) {
      const now = at(ridden);
      for (let part = 0; part < 3; part++) {
        expect(now.sky[part]!).toBeLessThanOrEqual(last.sky[part]! + 1e-9);
        expect(last.sky[part]! - now.sky[part]!).toBeLessThan(0.02);
      }
      expect(now.light).toBeLessThanOrEqual(last.light + 1e-9);
      last = {
        sky: [...now.sky] as [number, number, number],
        light: now.light,
        stars: now.stars,
        sun: now.sun,
      };
    }
  });

  it('brings the stars out as it goes: none for the first third, all of them at the finish', () => {
    expect(at(0).stars).toBe(0);
    expect(at(0.3).stars).toBe(0);
    expect(at(0.6).stars).toBeGreaterThan(0.05);
    expect(at(0.6).stars).toBeLessThan(0.5);
    expect(at(1).stars).toBe(1);
    let last = 0;
    for (let ridden = 0; ridden <= 1.0001; ridden += 0.02) {
      expect(at(ridden).stars).toBeGreaterThanOrEqual(last);
      last = at(ridden).stars;
    }
  });

  it('sets the sun: well clear of the horizon at the start, its lower limb on it at the finish', () => {
    expect(at(0).sun).toBeCloseTo(6);
    // The disc is 1.7 degrees from its middle to its limb.
    expect(at(1).sun).toBeGreaterThan(0.8);
    expect(at(1).sun).toBeLessThan(1.7);
    let last = at(0).sun;
    for (let ridden = 0.05; ridden <= 1.0001; ridden += 0.05) {
      const now = at(ridden).sun;
      expect(now).toBeLessThan(last);
      // Steadily: never more than a third of a degree in a twentieth of the course.
      expect(last - now).toBeLessThan(0.34);
      last = now;
    }
  });

  it('holds at its ends outside the ride', () => {
    expect(at(-1).light).toBe(at(0).light);
    expect(at(2).sky[1]).toBe(at(1).sky[1]);
  });
});
