import {
  type ComponentRef,
  DestroyRef,
  Directive,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  type Backend,
  type MapDto,
  RIDE_SETTINGS,
  type SceneRider,
  type SceneryRequest,
  type SceneryState,
} from '@telo/api';
import { worldQuality } from '@telo/domain';
import type { WorldScene } from '@telo/world';

/**
 * Draws the map's world where it sits (ADR 0030): it imports the world library when the race opens, so neither the
 * library nor Three.js enters the race's chunk, and creates its `WorldScene` there, which goes, renderer and all, when
 * the rider leaves the race. A dynamic import and `setInput`, rather than `@defer` or creation bindings, which would
 * each grow the initial bundle (L77).
 */
@Directive({ selector: '[wzRaceWorld]' })
export class RaceWorld {
  readonly map = input.required<MapDto>({ alias: 'wzRaceWorld' });
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** The race's other riders, metres from the rider (L2-064 AC3). */
  readonly riders = input.required<readonly SceneRider[]>();
  /** The real place to stream as 3D Tiles, with the rider's key, once the rider asks (L2-066). */
  readonly scenery = input<SceneryRequest | null>(null);
  /** Whether Google refused the key or the tiles stream (L2-066 AC4, AC7). */
  readonly sceneryState = output<SceneryState>();
  /** The GPU API drawing the world, once it has started (L2-065 AC1). */
  readonly started = output<Backend>();
  /** Neither WebGPU nor WebGL 2 could draw the world (L2-065 AC2). */
  readonly unavailable = output<void>();

  private readonly scene = signal<ComponentRef<WorldScene> | null>(null);
  /** The rider's World settings, as the world reads them (L2-159, L2-160, L2-161). */
  private readonly settings = inject(RIDE_SETTINGS).settings;
  /** One value until the settings change, so binding every second hands the scene nothing new. */
  private readonly quality = computed(() => worldQuality(this.settings()));

  constructor() {
    const host = inject(ViewContainerRef);
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => (destroyed = true));
    void import('@telo/world').then(({ WorldScene }) => {
      if (destroyed) return;
      const scene = host.createComponent(WorldScene);
      scene.instance.started.subscribe((backend) => this.started.emit(backend));
      scene.instance.unavailable.subscribe(() => this.unavailable.emit());
      scene.instance.sceneryState.subscribe((state) => this.sceneryState.emit(state));
      this.bind(scene);
      this.scene.set(scene);
    });
    effect(() => {
      const scene = this.scene();
      if (scene) this.bind(scene);
    });
  }

  /** Hands the scene the race's inputs; read in the effect, they follow the race. */
  private bind(scene: ComponentRef<WorldScene>): void {
    const map = this.map();
    scene.setInput('worldId', map.world);
    scene.setInput('segments', map.plan.segments);
    scene.setInput('elapsed', this.elapsed());
    scene.setInput('speedKmh', this.speedKmh());
    scene.setInput('running', this.running());
    scene.setInput('riders', this.riders());
    scene.setInput('scenery', this.scenery());
    scene.setInput('quality', this.quality());
  }
}
