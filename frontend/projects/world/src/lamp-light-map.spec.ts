import { Course, type CourseFile, type CourseLamps } from './course';
import { colourLightAt, colourLightMap, lampLightAt, lampLightMap } from './lamp-light-map';

/** A straight road north (-Z), a point every 4 m from 80 m before the start line, climbing 1 m every 4 m. */
function course(): Course {
  const points: number[] = [];
  for (let i = 0; i <= 80; i++) points.push(0, i, -(i - 20) * 4);
  const file: CourseFile = {
    id: 'test',
    name: 'Test course',
    lengthMetres: 200,
    durationSeconds: 30,
    step: 4,
    startIndex: 20,
    roadHalfWidth: 5,
    sun: [0, 1, 0],
    stages: [
      { kind: 'warm-up', start: 0, duration: 30, level: 10, cadenceAim: 80, from: 0, to: 200 },
    ],
    points,
  };
  return new Course(file);
}

const lamps: CourseLamps = { every: 24, first: 0, across: 5, height: 6, colour: 0xffe2a8 };

describe('lampLightMap (L2-166 AC14)', () => {
  const map = lampLightMap(course(), lamps);

  it('covers the whole road with room beside it', () => {
    expect(map.minX).toBeLessThan(-30);
    expect(map.minX + map.width * map.cell).toBeGreaterThan(30);
    expect(map.minZ).toBeLessThan(-240);
    expect(map.minZ + map.height * map.cell).toBeGreaterThan(80);
    expect(map.texels).toHaveLength(map.width * map.height * 2);
  });

  it('is brightest under a lamp', () => {
    // The lamp at the start line, on the right of a road that runs -Z: x = 5, z = 0.
    expect(lampLightAt(map, 5, 0).light).toBeGreaterThan(0.8);
  });

  it('is dim between two lamps and dark away from the road', () => {
    const under = lampLightAt(map, 5, 0).light;
    const between = lampLightAt(map, 5, -12).light;
    expect(between).toBeLessThan(under * 0.5);
    expect(between).toBeGreaterThan(0.02);
    expect(lampLightAt(map, 60, 0).light).toBe(0);
  });

  it("knows the road's height beside each stretch of it, so light can fade with height above it", () => {
    // The start line is the 20th point, 20 m up; 40 m on the road is 10 m higher.
    expect(lampLightAt(map, 8, 0).ground).toBeCloseTo(20, 0);
    expect(lampLightAt(map, -8, -40).ground).toBeCloseTo(30, 0);
  });

  it('lights nothing beyond its edges', () => {
    expect(lampLightAt(map, 99999, 0).light).toBe(0);
  });
});

describe('colourLightMap (L2-166 AC23)', () => {
  const cyan = { x: 0, z: -100, colour: 0x00ffff, reach: 16, strength: 0.6 };
  const pink = { x: 12, z: -100, colour: 0xff0080, reach: 16, strength: 0.6 };
  const map = colourLightMap(course(), [cyan, pink]);

  it('holds a light in its own colour, strongest beneath it', () => {
    const [red, green, blue] = colourLightAt(map, -2, -100);
    expect(green).toBeGreaterThan(0.3);
    expect(blue).toBeGreaterThan(0.3);
    expect(green).toBeGreaterThan(red * 2);
  });

  it('is dark beyond every light’s reach', () => {
    expect(colourLightAt(map, 0, -140)).toEqual([0, 0, 0]);
    expect(colourLightAt(map, 0, 99999)).toEqual([0, 0, 0]);
  });

  it('adds the colours of lights whose pools overlap', () => {
    const [red, green, blue] = colourLightAt(map, 6, -100);
    expect(red).toBeGreaterThan(0.05);
    expect(green).toBeGreaterThan(0.05);
    expect(blue).toBeGreaterThan(0.1);
  });

  it('is dark with no lights', () => {
    const none = colourLightMap(course(), []);
    expect(colourLightAt(none, 0, -100)).toEqual([0, 0, 0]);
  });
});
