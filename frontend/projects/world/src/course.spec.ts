import { Course, type CourseFile, courseLamps, courseLook, courseWet, parseCourse } from './course';

/**
 * A straight road north (-Z), a point every 4 m from 8 m before the start line: flat for 40 m, then climbing 10 %
 * for 40 m, then flat again. Its warm-up rides the flat at 2 m/s, its effort the climb at 4 m/s.
 */
function courseFile(): CourseFile {
  const points: number[] = [];
  for (let i = 0; i <= 32; i++) {
    const metres = (i - 2) * 4;
    points.push(0, 0.1 * Math.min(Math.max(metres - 40, 0), 40), -metres);
  }
  return {
    id: 'test',
    name: 'Test course',
    lengthMetres: 80,
    durationSeconds: 30,
    step: 4,
    startIndex: 2,
    roadHalfWidth: 4,
    sun: [0, 1, 0],
    stages: [
      { kind: 'warm-up', start: 0, duration: 20, level: 10, cadenceAim: 80, from: 0, to: 40 },
      { kind: 'work', start: 20, duration: 10, level: 20, cadenceAim: 90, from: 40, to: 80 },
    ],
    points,
  };
}

describe('Course (L2-166)', () => {
  it.each([
    [0, 0],
    [10, 20],
    [20, 40],
    [25, 60],
    [30, 80],
  ])(
    'puts the rider at %i s on metre %i: each stage rides its own stretch (AC2)',
    (seconds, metres) => {
      expect(new Course(courseFile()).metresAt(seconds)).toBeCloseTo(metres);
    },
  );

  it('rolls on down the run-out past the finish, and stops at the end of the road', () => {
    const course = new Course(courseFile());
    expect(course.metresAt(32)).toBeCloseTo(88);
    expect(course.metresAt(600)).toBeCloseTo(course.end);
    expect(course.end).toBe(120);
  });

  it('holds the start line before the clock starts', () => {
    expect(new Course(courseFile()).metresAt(-3)).toBe(0);
  });

  it.each([
    [10, 'warm-up'],
    [20, 'work'],
    [29, 'work'],
    [45, 'work'],
  ])('names the stage at %i s: %s', (seconds, kind) => {
    expect(new Course(courseFile()).stageAt(seconds).kind).toBe(kind);
  });

  it('places the rider on the centre line, facing up the road', () => {
    const place = new Course(courseFile()).place(18);
    expect(place.x).toBeCloseTo(0);
    expect(place.y).toBeCloseTo(0);
    expect(place.z).toBeCloseTo(-18);
    expect(place.heading).toBeCloseTo(0);
    expect(place.pitch).toBeCloseTo(0);
  });

  it('climbs where the resistance is higher (AC3)', () => {
    const course = new Course(courseFile());
    expect(course.gradeAt(20)).toBeCloseTo(0);
    expect(course.gradeAt(60)).toBeCloseTo(10);
    expect(course.place(60).y).toBeCloseTo(2);
  });

  it('puts a lane to the right of the road', () => {
    expect(new Course(courseFile()).place(18, 1.5).x).toBeCloseTo(1.5);
  });

  it('writes the place into the object it is given', () => {
    const into = { x: 9, y: 9, z: 9, heading: 9, pitch: 9 };
    expect(new Course(courseFile()).place(18, 0, into)).toBe(into);
    expect(into.z).toBeCloseTo(-18);
  });
});

describe('parseCourse (L2-166 AC5)', () => {
  it('reads a course file', () => {
    expect(parseCourse(courseFile()).id).toBe('test');
  });

  it.each([
    ['nothing', null, 'The course file is not an object.'],
    ['no name', { ...courseFile(), name: 7 }, 'The course file names no course.'],
    ['no step', { ...courseFile(), step: 0 }, 'The course has no length.'],
    [
      'a broken centre line',
      { ...courseFile(), points: [0, 1] },
      "The course's centre line is not a list of points.",
    ],
    [
      'a centre line that stops short',
      { ...courseFile(), points: [0, 0, 0, 0, 0, -4] },
      "The course's centre line ends before its finish.",
    ],
    ['no sun', { ...courseFile(), sun: [0, 1] }, "The course's sun has no direction."],
    ['no stages', { ...courseFile(), stages: [] }, 'The course has no stages.'],
    [
      'a stage of an unknown kind',
      { ...courseFile(), stages: [{ ...courseFile().stages[0], kind: 'sprint' }] },
      'A stage of the course is malformed.',
    ],
  ])('refuses %s', (_, value, message) => {
    expect(() => parseCourse(value)).toThrow(message);
  });
});

describe('courseLook (L2-166)', () => {
  it("draws a course that names no sky in Ibiza's sunset", () => {
    const look = courseLook(courseFile());
    expect(look.sky).toEqual([0xffc27a, 0xf7a070, 0xe0708a, 0x7a4f9a, 0x2f2a5e]);
    expect(look.haze).toBe(0xf2a77a);
    expect(look.light).toEqual({ colour: 0xff9a5a, intensity: 2.6 });
    expect(look.fill).toEqual([0xffd9c0, 0x6a5a7a]);
  });

  it("draws a course in its own world's sky, haze and light", () => {
    const look = courseLook({
      ...courseFile(),
      sky: ['#2a2448', '#1c1c3c', '#12142c', '#0a0c1e', '#05060f'],
      haze: '#1e2040',
      light: { colour: '#9ab0ff', intensity: 0.9 },
      fill: ['#5a6aa8', '#2a1e3a'],
    });
    expect(look.sky).toEqual([0x2a2448, 0x1c1c3c, 0x12142c, 0x0a0c1e, 0x05060f]);
    expect(look.haze).toBe(0x1e2040);
    expect(look.light).toEqual({ colour: 0x9ab0ff, intensity: 0.9 });
    expect(look.fill).toEqual([0x5a6aa8, 0x2a1e3a]);
  });

  it('keeps the sunset where a colour is not a colour: the file is data', () => {
    const look = courseLook({ ...courseFile(), sky: ['red'], haze: 'javascript:1' });
    expect(look.sky).toEqual([0xffc27a, 0xf7a070, 0xe0708a, 0x7a4f9a, 0x2f2a5e]);
    expect(look.haze).toBe(0xf2a77a);
  });
});

describe('courseLamps (L2-166 AC13)', () => {
  const lamps = { every: 24, first: -68, across: 5.1, height: 6.65, colour: '#ffe2a8' };

  it('reads the street lamps a course file names', () => {
    expect(courseLamps({ ...courseFile(), lamps })).toEqual({ ...lamps, colour: 0xffe2a8 });
  });

  it('lights no lamp on a course that names none', () => {
    expect(courseLamps(courseFile())).toBeNull();
  });

  it.each([
    ['a spacing of nothing', { ...lamps, every: 0 }],
    ['a height of nothing', { ...lamps, height: 0 }],
    ['a place that is not a number', { ...lamps, first: 'start' }],
    ['a distance across that is not a number', { ...lamps, across: null }],
    ['a colour that is not a colour', { ...lamps, colour: 'javascript:1' }],
  ])('lights no lamp for %s: the file is data', (_, malformed) => {
    expect(courseLamps({ ...courseFile(), lamps: malformed } as unknown as CourseFile)).toBeNull();
  });
});

describe('courseWet (L2-166 AC20)', () => {
  it.each([
    [0.55, 0.55],
    [0, 0],
    [1, 1],
    [1.7, 1],
    [-0.2, 0],
  ])('reads a wet of %d as %d', (named, wet) => {
    expect(courseWet({ ...courseFile(), wet: named })).toBe(wet);
  });

  it.each([[undefined], ['soaked'], [null], [Number.NaN]])(
    'keeps the ground dry for %s: the file is data',
    (named) => {
      expect(courseWet({ ...courseFile(), wet: named } as unknown as CourseFile)).toBe(0);
    },
  );
});
