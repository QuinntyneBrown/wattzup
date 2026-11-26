import {
  type ComponentRef,
  DestroyRef,
  DOCUMENT,
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
  DISPLAY_PREFERENCES,
  RIDE_SETTINGS,
  type SceneRider,
  type SceneryRequest,
  type SceneryState,
} from '@telo/api';
import { worldQuality } from '@telo/domain';
import type { WorldMusicPlayer, WorldScene } from '@telo/world';

/**
 * Draws the map's world where it sits (ADR 0030): it imports the world library when the race opens, so neither the
 * library nor Three.js enters the race's chunk, and creates its `WorldScene` there, which goes, renderer and all, when
 * the rider leaves the race. A dynamic import and `setInput`, rather than `@defer` or creation bindings, which would
 * each grow the initial bundle (L77).
 */
@Directive({ selector: '[wzRaceWorld]' })
export class RaceWorld {
  readonly map = input.required<MapDto>({ alias: 'wzRaceWorld' });
  readonly sunrise = input(false);
  readonly raceMetres = input.required<number>();
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
  /** Reduce motion as the rider's Settings apply it, which stills the world's moving parts (L2-164 AC2). */
  private readonly display = inject(DISPLAY_PREFERENCES);
  /** One value until the settings change, so binding every second hands the scene nothing new. */
  private readonly quality = computed(() => worldQuality(this.settings()));

  constructor() {
    const host = inject(ViewContainerRef);
    const doc = inject(DOCUMENT);
    const visible = signal(!doc.hidden);
    const onVisibility = () => visible.set(!doc.hidden);
    const music = signal<WorldMusicPlayer | null>(null);
    let lapBell: WorldMusicPlayer | undefined;
    let trackLoaded = false;
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      doc.removeEventListener('visibilitychange', onVisibility);
      music()?.destroy();
      lapBell?.destroy();
    });
    void import('@telo/world').then(({ WorldScene, WorldMusicPlayer }) => {
      if (destroyed) return;
      if (['bluemountains', 'ghent', 'velodrome'].includes(this.map().world)) {
        if (this.map().world === 'velodrome')
          lapBell = new WorldMusicPlayer(() => doc.createElement('audio'), doc);
        doc.addEventListener('visibilitychange', onVisibility);
        music.set(new WorldMusicPlayer(() => doc.createElement('audio'), doc));
      }
      const scene = host.createComponent(WorldScene);
      scene.instance.started.subscribe((backend) => this.started.emit(backend));
      scene.instance.unavailable.subscribe(() => this.unavailable.emit());
      scene.instance.sceneryState.subscribe((state) => this.sceneryState.emit(state));
      this.bind(scene);
      this.scene.set(scene);
    });
    effect(() => {
      const player = music();
      if (!player) return;
      if (this.map().world === 'velodrome') {
        const audible = this.settings().worldMusic && this.running() && visible();
        const metres = this.raceMetres();
        const lapPosition = metres % 250;
        const ringing = audible && metres > 217 && (lapPosition > 217 || lapPosition < 20);
        if (audible) player.load('velodrome', 'music/lee-valley-stands.ogg');
        if (ringing) lapBell?.load('velodrome', 'music/lee-valley-bell.ogg');
        player.setVolume(0.58);
        player.sync(audible);
        lapBell?.sync(ringing);
        return;
      }
      if (this.map().world === 'ghent') {
        const audible = this.settings().worldMusic && this.running() && visible();
        if (audible) player.load('ghent', 'music/ghent-six-day.ogg');
        player.sync(audible);
        return;
      }
      const metres = this.raceMetres();
      const distance = Math.min(Math.abs(metres - 1540), Math.abs(metres - 8860));
      const audible = distance < 125 && this.settings().worldMusic && this.running() && visible();
      if (audible) {
        if (!trackLoaded) {
          player.load('bluemountains');
          trackLoaded = true;
        }
        player.setVolume(0.65 * (1 - distance / 125) ** 2);
      }
      player.sync(audible);
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
    scene.setInput('sunrise', map.world === 'cherryblossom' && this.sunrise());
    scene.setInput('segments', map.plan.segments);
    scene.setInput('raceMetres', this.raceMetres());
    scene.setInput('elapsed', this.elapsed());
    scene.setInput('speedKmh', this.speedKmh());
    scene.setInput('running', this.running());
    scene.setInput('riders', this.riders());
    scene.setInput('scenery', this.scenery());
    scene.setInput('quality', this.quality());
    scene.setInput('reducedMotion', this.display.reducedMotion());
  }
}
