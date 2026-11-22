// The renderer the world scene is handed (ADR 0032): it learns the world only when the scene starts, so it imports
// the course renderer for a world built in Blender and `main`'s renderer for every other, and passes each call on.
// Neither renderer, nor Three.js, is imported before then. A course follows no real place: when the rider streams
// one (Old Town's real Bruges, L2-066), `main`'s renderer, which can, takes the canvas over from the course.
import type {
  Backend,
  RealPlace,
  SceneFrame,
  SceneryState,
  TimedSegment as Segment,
  World,
  WorldRenderer,
} from '@telo/api';
import { coursePath } from './course-worlds';

export class MapRenderer implements WorldRenderer {
  private renderer: WorldRenderer | null = null;
  private disposed = false;
  /** What the scene started with, kept while a course draws so `main`'s renderer can take over to stream. */
  private started: {
    canvas: HTMLCanvasElement;
    world: World;
    nextFrame: () => Promise<void>;
    segments?: readonly Segment[];
  } | null = null;
  private size: readonly [number, number, number] | null = null;
  private period: number | null = null;

  get backend(): Backend {
    return this.renderer?.backend ?? 'webgl2';
  }

  async start(
    canvas: HTMLCanvasElement,
    world: World,
    nextFrame: () => Promise<void>,
    segments?: readonly Segment[],
  ): Promise<boolean> {
    const path = coursePath(world.id);
    const renderer: WorldRenderer =
      path === null
        ? await import('./world-renderer').then((m) => new m.ThreeWorldRenderer())
        : await import('./course-renderer').then((m) => new m.CourseRenderer(path));
    // The scene may have gone while the renderer's chunk loaded.
    if (this.disposed) {
      renderer.dispose();
      return false;
    }
    this.renderer = renderer;
    this.started = path === null ? null : { canvas, world, nextFrame, segments };
    return renderer.start(canvas, world, nextFrame, segments);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.size = [width, height, pixelRatio];
    this.renderer?.resize(width, height, pixelRatio);
  }

  draw(frame: SceneFrame): void {
    this.renderer?.draw(frame);
  }

  setFramePeriod(ms: number): void {
    this.period = ms;
    this.renderer?.setFramePeriod(ms);
  }

  pauseBudget(): void {
    this.renderer?.pauseBudget();
  }

  stream(place: RealPlace, key: string, report: (state: SceneryState) => void): void {
    const started = this.started;
    if (!started) {
      this.renderer?.stream(place, key, report);
      return;
    }
    // The course gives the canvas to `main`'s renderer, which streams the real place.
    this.started = null;
    void this.streamWithWorldRide(started, place, key, report);
  }

  private async streamWithWorldRide(
    started: NonNullable<MapRenderer['started']>,
    place: RealPlace,
    key: string,
    report: (state: SceneryState) => void,
  ): Promise<void> {
    const worldRide = await import('./world-renderer').then((m) => new m.ThreeWorldRenderer());
    if (this.disposed) {
      worldRide.dispose();
      return;
    }
    this.renderer?.dispose();
    this.renderer = worldRide;
    const drawn = await worldRide.start(
      started.canvas,
      started.world,
      started.nextFrame,
      started.segments,
    );
    if (this.disposed || this.renderer !== worldRide) return;
    if (this.size) worldRide.resize(...this.size);
    if (this.period !== null) worldRide.setFramePeriod(this.period);
    if (drawn) worldRide.stream(place, key, report);
  }

  dispose(): void {
    this.disposed = true;
    this.started = null;
    this.renderer?.dispose();
    this.renderer = null;
  }
}
