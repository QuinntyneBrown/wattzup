// A course: a map built in Blender from the class it is modelled after (ADR 0032, L2-166). The Blender pipeline
// (tools/blender/build_course.py) writes the road's centre line and the plan's stages along it beside the map's glb;
// this reads that file and answers where the ride's clock puts the rider on the road. No Three.js here.
import type { SegmentKind } from '@telo/api';

/** One stage of the course: a segment of the class's plan, with the stretch of road it rides. */
export interface CourseStage {
  readonly kind: SegmentKind;
  /** Whole seconds from the plan's start. */
  readonly start: number;
  readonly duration: number;
  /** The target resistance, 1 to 32: what the stretch's gradient is laid from. */
  readonly level: number;
  /** In rpm: with the duration, what the stretch's length is laid from. */
  readonly cadenceAim: number;
  /** Metres from the start line. */
  readonly from: number;
  readonly to: number;
}

/** `<id>.course.json` as the Blender pipeline writes it. */
export interface CourseFile {
  readonly id: string;
  readonly name: string;
  readonly lengthMetres: number;
  readonly durationSeconds: number;
  /** Metres between the centre line's points. */
  readonly step: number;
  /** The point on the start line: the road runs on before it and after the finish. */
  readonly startIndex: number;
  readonly roadHalfWidth: number;
  /** Where the light comes from, a unit vector in the map's axes. */
  readonly sun: readonly [number, number, number];
  readonly stages: readonly CourseStage[];
  /** The centre line, x, y, z a point, in the glb's axes (+Y up), metres. */
  readonly points: readonly number[];
  /** The world's sky from the horizon up, as `#rrggbb`; a course without one is drawn in Ibiza's sunset. */
  readonly sky?: readonly string[];
  /** The haze the distance fades into. */
  readonly haze?: string;
  /** The sun's (or the moon's) light. */
  readonly light?: { readonly colour: string; readonly intensity: number };
  /** The fill light from the sky and from the ground. */
  readonly fill?: readonly [string, string];
  /** The street lamps that light the ground, where the course has them. */
  readonly lamps?: {
    /** Metres of road between one lamp and the next, on both sides. */
    readonly every: number;
    /** Metres from the start line to a lamp: negative is before it. */
    readonly first: number;
    /** Metres from the road's centre line to the light, either side. */
    readonly across: number;
    /** The light's height above the road, in metres. */
    readonly height: number;
    readonly colour: string;
  };
}

/** A course's street lamps, as numbers the ground's material reads. */
export interface CourseLamps {
  readonly every: number;
  readonly first: number;
  readonly across: number;
  readonly height: number;
  readonly colour: number;
}

/** How a course's world is lit and what its sky is, as colours Three.js reads. */
export interface CourseLook {
  readonly sky: readonly number[];
  readonly haze: number;
  readonly light: { readonly colour: number; readonly intensity: number };
  readonly fill: readonly [number, number];
}

/** Ibiza Sunset Strip's sunset: the look of a course file that names none. */
const SUNSET: CourseLook = {
  sky: [0xffc27a, 0xf7a070, 0xe0708a, 0x7a4f9a, 0x2f2a5e],
  haze: 0xf2a77a,
  light: { colour: 0xff9a5a, intensity: 2.6 },
  fill: [0xffd9c0, 0x6a5a7a],
};

/** `#rrggbb` as a number, or null for anything else: the file is data, read as nothing else. */
function colour(value: unknown): number | null {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? parseInt(value.slice(1), 16)
    : null;
}

/** The course's sky, haze and lights; each part it does not name, or names wrongly, is the sunset's. */
export function courseLook(file: CourseFile): CourseLook {
  const sky = Array.isArray(file.sky) ? file.sky.map(colour) : [];
  const fill = Array.isArray(file.fill) ? file.fill.map(colour) : [];
  const light = colour(file.light?.colour);
  const intensity = file.light?.intensity;
  return {
    sky: sky.length >= 2 && sky.every((c) => c !== null) ? (sky as number[]) : SUNSET.sky,
    haze: colour(file.haze) ?? SUNSET.haze,
    light:
      light !== null && isNumber(intensity) && intensity >= 0
        ? { colour: light, intensity }
        : SUNSET.light,
    fill: fill.length === 2 && fill.every((c) => c !== null) ? [fill[0]!, fill[1]!] : SUNSET.fill,
  };
}

/** The course's street lamps, or null where it names none or names them wrongly: the file is data. */
export function courseLamps(file: CourseFile): CourseLamps | null {
  const lamps = file.lamps as Partial<NonNullable<CourseFile['lamps']>> | undefined;
  if (!lamps || typeof lamps !== 'object') return null;
  const { every, first, across, height } = lamps;
  const tint = colour(lamps.colour);
  if (!isNumber(every) || !isNumber(first) || !isNumber(across) || !isNumber(height)) return null;
  if (every <= 0 || height <= 0 || tint === null) return null;
  return { every, first, across, height, colour: tint };
}

/** A place on the road, in the map's axes. */
export interface CoursePlace {
  x: number;
  y: number;
  z: number;
  /** The road's direction as a rotation about +Y, in radians: 0 faces -Z, as the cyclist kit's rider does. */
  heading: number;
  /** The road's slope, in radians: positive climbs. */
  pitch: number;
}

const KINDS: readonly string[] = ['warm-up', 'work', 'recover', 'steady', 'cool-down'];

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** The course file, or an error naming what is wrong with it: the file is data, read as nothing else. */
export function parseCourse(value: unknown): CourseFile {
  const file = value as Partial<CourseFile> | null;
  if (!file || typeof file !== 'object') throw new Error('The course file is not an object.');
  if (typeof file.id !== 'string' || typeof file.name !== 'string') {
    throw new Error('The course file names no course.');
  }
  for (const key of [
    'lengthMetres',
    'durationSeconds',
    'step',
    'startIndex',
    'roadHalfWidth',
  ] as const) {
    if (!isNumber(file[key]) || file[key] < 0)
      throw new Error(`The course's ${key} is not a number.`);
  }
  if (!file.step || !file.lengthMetres) throw new Error('The course has no length.');
  const { points, stages, sun } = file;
  if (!Array.isArray(points) || points.length % 3 !== 0 || !points.every(isNumber)) {
    throw new Error("The course's centre line is not a list of points.");
  }
  const needed = file.startIndex! + Math.ceil(file.lengthMetres / file.step) + 1;
  if (points.length / 3 < needed)
    throw new Error("The course's centre line ends before its finish.");
  if (!Array.isArray(sun) || sun.length !== 3 || !sun.every(isNumber)) {
    throw new Error("The course's sun has no direction.");
  }
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('The course has no stages.');
  for (const stage of stages as readonly Partial<CourseStage>[]) {
    const numbers = [
      stage.start,
      stage.duration,
      stage.level,
      stage.cadenceAim,
      stage.from,
      stage.to,
    ];
    if (!KINDS.includes(stage.kind ?? '') || !numbers.every(isNumber) || stage.to! < stage.from!) {
      throw new Error('A stage of the course is malformed.');
    }
  }
  return file as CourseFile;
}

/** The road of a course, asked by the ride's clock and by metres along it. */
export class Course {
  readonly length: number;
  readonly duration: number;
  readonly stages: readonly CourseStage[];
  private readonly points: readonly number[];
  private readonly count: number;

  constructor(readonly file: CourseFile) {
    this.length = file.lengthMetres;
    this.duration = file.durationSeconds;
    this.stages = file.stages;
    this.points = file.points;
    this.count = file.points.length / 3;
  }

  /** The stage the clock is in; the last one from the finish on. */
  stageAt(seconds: number): CourseStage {
    const stage = this.stages.find((s) => seconds < s.start + s.duration);
    return stage ?? this.stages[this.stages.length - 1]!;
  }

  /**
   * Metres from the start line at `seconds` of the ride's clock: each stage's stretch is ridden evenly over the
   * stage, so every hill arrives with the resistance it was laid from. Past the finish the rider rolls on at the
   * last stage's pace, down the run-out.
   */
  metresAt(seconds: number): number {
    const t = Math.max(seconds, 0);
    const stage = this.stageAt(t);
    const pace = stage.duration > 0 ? (stage.to - stage.from) / stage.duration : 0;
    return Math.min(stage.from + (t - stage.start) * pace, this.end);
  }

  /** The last metre of road, past the finish line. */
  get end(): number {
    return (this.count - 1 - this.file.startIndex) * this.file.step;
  }

  /** The gradient at `metres`, in percent: positive climbs. */
  gradeAt(metres: number): number {
    return Math.tan(this.place(metres).pitch) * 100;
  }

  /**
   * The place `metres` from the start line and `lane` metres right of the centre line, written into `into` so a
   * frame allocates nothing.
   */
  place(
    metres: number,
    lane = 0,
    into: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 },
  ): CoursePlace {
    const { step, startIndex } = this.file;
    const at = Math.min(Math.max(metres / step + startIndex, 0), this.count - 1);
    const i = Math.min(Math.floor(at), this.count - 2);
    const t = at - i;
    const p = this.points;
    const a = i * 3;
    const b = a + 3;
    // The direction eases from one point's to the next's, so the camera turns without steps.
    const before = Math.max(i - 1, 0) * 3;
    const after = Math.min(i + 2, this.count - 1) * 3;
    const tx = (p[b]! - p[before]!) * (1 - t) + (p[after]! - p[a]!) * t;
    const ty = (p[b + 1]! - p[before + 1]!) * (1 - t) + (p[after + 1]! - p[a + 1]!) * t;
    const tz = (p[b + 2]! - p[before + 2]!) * (1 - t) + (p[after + 2]! - p[a + 2]!) * t;
    const flat = Math.hypot(tx, tz) || 1;
    // Right of the road's direction, with +Y up.
    into.x = p[a]! + (p[b]! - p[a]!) * t + (-tz / flat) * lane;
    into.y = p[a + 1]! + (p[b + 1]! - p[a + 1]!) * t;
    into.z = p[a + 2]! + (p[b + 2]! - p[a + 2]!) * t + (tx / flat) * lane;
    into.heading = Math.atan2(-tx, -tz);
    into.pitch = Math.atan2(ty, flat);
    return into;
  }
}
