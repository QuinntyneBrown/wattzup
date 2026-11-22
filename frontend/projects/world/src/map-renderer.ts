// The renderer the world scene is handed (ADR 0032): it learns the world only when the scene starts, so it imports
// the course renderer for a world built in Blender and `main`'s renderer for every other, and passes each call on.
// Neither renderer, nor Three.js, is imported before then.
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
    return renderer.start(canvas, world, nextFrame, segments);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.renderer?.resize(width, height, pixelRatio);
  }

  draw(frame: SceneFrame): void {
    this.renderer?.draw(frame);
  }

  setFramePeriod(ms: number): void {
    this.renderer?.setFramePeriod(ms);
  }

  pauseBudget(): void {
    this.renderer?.pauseBudget();
  }

  stream(place: RealPlace, key: string, report: (state: SceneryState) => void): void {
    this.renderer?.stream(place, key, report);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer?.dispose();
    this.renderer = null;
  }
}
