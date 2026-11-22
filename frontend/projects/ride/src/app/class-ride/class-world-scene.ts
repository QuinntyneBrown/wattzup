import {
  type ComponentRef,
  DOCUMENT,
  DestroyRef,
  Directive,
  ViewContainerRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { PreparedWorld, Segment, WorldId } from '@telo/api';
import type { WorldMusicPlayer, WorldScene } from '@telo/world';

/**
 * The class's world on the class ride's stage (L2-153 AC3, AC5): it imports the world library when the ride opens, as
 * the race's `RaceWorld` does, so neither the library nor Three.js enters the class ride's chunk. With the renderer
 * World loading warmed up it creates `main`'s `WorldScene` there, which draws with it and fades it in, and goes,
 * renderer and all, when the rider leaves. It plays the world's own track (`main`'s `WorldMusicPlayer`) while `music`
 * says so (L2-163 AC1), and stops it when the rider leaves. A dynamic import and `setInput`, rather than `@defer`
 * (L77).
 */
@Directive({ selector: '[wzClassWorldScene]' })
export class ClassWorldScene {
  readonly worldId = input.required<WorldId>({ alias: 'wzClassWorldScene' });
  /** The renderer World loading started, with its canvas; `null` rides the panorama, with no scene. */
  readonly prepared = input.required<PreparedWorld | null>();
  readonly segments = input.required<readonly Segment[]>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** Whether the world's track plays: the ride runs and no class video is playing its own sound (L2-163 AC1). */
  readonly music = input.required<boolean>();

  private readonly scene = signal<ComponentRef<WorldScene> | null>(null);
  private readonly player = signal<WorldMusicPlayer | null>(null);

  constructor() {
    const host = inject(ViewContainerRef);
    const doc = inject(DOCUMENT);
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.player()?.destroy();
    });
    void import('@telo/world').then(({ WorldMusicPlayer, WorldScene }) => {
      if (destroyed) return;
      const player = new WorldMusicPlayer(() => doc.createElement('audio'), doc);
      player.load(this.worldId());
      this.player.set(player);
      const prepared = this.prepared();
      if (!prepared) return;
      const scene = host.createComponent(WorldScene);
      scene.setInput('prepared', prepared);
      this.bind(scene);
      this.scene.set(scene);
    });
    effect(() => {
      const scene = this.scene();
      if (scene) this.bind(scene);
    });
    effect(() => this.player()?.sync(this.music()));
  }

  /** Hands the scene the ride's inputs; read in the effect, they follow the ride. */
  private bind(scene: ComponentRef<WorldScene>): void {
    scene.setInput('worldId', this.worldId());
    scene.setInput('segments', this.segments());
    scene.setInput('elapsed', this.elapsed());
    scene.setInput('speedKmh', this.speedKmh());
    scene.setInput('running', this.running());
  }
}
