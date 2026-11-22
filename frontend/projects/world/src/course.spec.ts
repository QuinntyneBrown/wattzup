import { Course, type CourseFile, parseCourse } from './course';

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
