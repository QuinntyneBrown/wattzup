// Steps the rider through the scene each frame and hands the frame to the renderer (L2-110).
import type { SceneRider, TimedSegment as Segment, WorldRenderer } from '@telo/api';

export interface SceneInput {
  readonly segments: readonly Segment[];
  /** Race distance at the last telemetry tick, including time spent off screen. */
  readonly raceMetres?: number | undefined;
  readonly elapsed: number;
  readonly speedKmh: number | null;
  readonly running: boolean;
  readonly reducedMotion: boolean;
  /** The race's other riders; absent outside a race (L2-064 AC3). */
  readonly riders?: readonly SceneRider[];
}

/** The longest step one frame takes, so the rider does not leap after a hidden tab. */
const MAX_STEP = 0.25;
/** Metres per turn of the pedals, near a road bike in a middle gear. */
const METRES_PER_TURN = 5;

export class SceneDriver {
  private s = 0;
  private crank = 0;
  private lastRaceMetres: number | undefined;
  private interpolatedSeconds = 0;
  private last: number | null = null;
  private time: number | null = null;

  constructor(private readonly renderer: WorldRenderer) {}

  /** Draws the frame at `now` (ms); the rider moves only while the ride runs (L2-109 AC1). */
  frame(now: number, input: SceneInput): void {
    const dt = this.last === null ? 0 : Math.min(Math.max((now - this.last) / 1000, 0), MAX_STEP);
    this.last = now;
    const speedKmh = input.speedKmh ?? 0;
    if (input.running) {
      const metres = (speedKmh / 3.6) * dt;
      if (input.raceMetres === undefined) {
        this.s += metres;
      } else if (input.raceMetres !== this.lastRaceMetres) {
        this.s = input.raceMetres;
        this.interpolatedSeconds = 0;
        this.lastRaceMetres = input.raceMetres;
      } else {
        // Animate between whole-second race updates. A long frame cannot leave the
        // camera behind the standings or send it ahead of the next telemetry tick.
        const step = Math.min(dt, 1 - this.interpolatedSeconds);
        this.s += (speedKmh / 3.6) * step;
        this.interpolatedSeconds += step;
      }
      this.crank = (this.crank + (metres / METRES_PER_TURN) * 2 * Math.PI) % (2 * Math.PI);
    }
    if (!input.running && input.raceMetres !== undefined) {
      this.s = input.raceMetres;
      this.lastRaceMetres = input.raceMetres;
      this.interpolatedSeconds = 0;
    }
    // The engine counts whole seconds; the scene's clock runs on between them, never more than a
    // second ahead of the engine and never behind it (#897).
    if (this.time === null) this.time = input.elapsed;
    else if (input.running) this.time += dt;
    this.time = Math.min(Math.max(this.time, input.elapsed), input.elapsed + 1);
    this.renderer.draw({
      s: this.s,
      crank: this.crank,
      segments: input.segments,
      elapsed: input.elapsed,
      time: this.time,
      speedKmh,
      reducedMotion: input.reducedMotion,
      ...(input.riders ? { riders: input.riders } : {}),
    });
  }
}
