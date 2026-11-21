import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CLASS_API, type ClassEntry } from '@wattzup/api';
import { WorldRide } from '@wattzup/components';
import { CountdownService } from '../../core/countdown.service';
import { DialogLauncher } from '../../core/dialog-launcher';
import { formatDuration } from '../../core/format-duration';
import { LiveStateService } from '../../core/live-state.service';
import { MusicPreference } from '../../core/music-preference';
import { ResistanceCommandService } from '../../core/resistance-command.service';
import { stepLevel } from '../../core/resistance-controls';
import { RideActions } from '../../core/ride-actions';
import { RideSound } from '../../core/ride-sound.service';
import { worldRideAccess } from '../../core/world-ride-access';
import { musicPlays } from '../../core/world-music';
import { WorldMusicPlayer } from '../../core/world-music-player';
import { worldRideView } from '../../core/world-ride-view';
import { worldById } from '../../core/worlds';
import { ClassNotFound } from '../class-not-found/class-not-found';
import { WorldScene } from '../world-scene/world-scene';

type Phase = 'loading' | 'ready' | 'not-found';

/**
 * Route `/classes/:id/world`: the ride in progress of class `:id` in that class's scene. It reads
 * the class and the live state, and drives the ride through the dashboard's commands (L2-102).
 */
@Component({
  selector: 'wz-world-ride-page',
  imports: [ClassNotFound, WorldRide, WorldScene],
  templateUrl: './world-ride-page.html',
  styleUrl: './world-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CountdownService,
    {
      provide: WorldMusicPlayer,
      useFactory: () => new WorldMusicPlayer(() => new Audio(), inject(DOCUMENT)),
    },
  ],
})
export class WorldRidePage {
  /** The route's `:id`. */
  readonly id = input.required<string>();

  private readonly classes = inject(CLASS_API);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly live = inject(LiveStateService);
  private readonly actions = inject(RideActions);
  private readonly resistance = inject(ResistanceCommandService);
  private readonly timer = inject(CountdownService);
  private readonly music = inject(WorldMusicPlayer);
  private readonly musicPreference = inject(MusicPreference);
  protected readonly rideSound = inject(RideSound);
  protected readonly dialogs = inject(DialogLauncher);
  protected readonly musicOn = this.musicPreference.on;

  protected readonly phase = signal<Phase>('loading');
  private readonly entry = signal<ClassEntry | null>(null);
  /** Decided once, when the class and the first state are both in (L2-102 AC3, AC4). */
  private readonly shown = signal(false);

  /** Set once the scene reports it cannot draw (L2-110 AC4). */
  protected readonly sceneUnavailable = signal(false);

  private readonly world = computed(() => {
    const id = this.entry()?.world;
    return id ? worldById(id) : null;
  });

  protected readonly view = computed(() => {
    const state = this.live.state();
    const entry = this.entry();
    const world = this.world();
    return this.shown() && state && entry && world ? worldRideView(state, entry, world) : null;
  });

  /** What the scene draws; null once it reports it cannot (L2-110 AC4). */
  protected readonly scene = computed(() => {
    const world = this.world();
    if (!world || this.sceneUnavailable()) return null;
    const state = this.live.state();
    const workout = state?.workout;
    return {
      world,
      segments: workout?.segments ?? [],
      elapsed: workout?.elapsed_seconds ?? 0,
      speedKmh: state?.speed_kmh ?? null,
      running: workout?.status === 'running',
    };
  });

  protected readonly clock = computed(() => ({
    elapsed: this.timer.elapsedText(),
    total: formatDuration(this.live.state()?.workout?.total_seconds ?? 0),
  }));

  protected readonly countdown = computed(() => {
    const w = this.live.state()?.workout;
    const duration = w?.segments[w.segment]?.duration ?? 0;
    const left = this.timer.wholeLeft();
    return {
      left: this.timer.remainingText(),
      ridden: Math.max(0, Math.min(duration, duration - left)),
      duration,
      width: `${(this.timer.progress() * 100).toFixed(2)}%`,
    };
  });

  protected readonly reconnecting = this.actions.reconnecting;

  protected readonly classHref = computed(() => `/classes/${encodeURIComponent(this.id())}`);

  constructor() {
    this.live.ensureStarted();
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    // The in-browser engine publishes a ride's state before the class page navigates here, so the
    // state held when the page opens is current: it shows the ride or sends the rider away.
    effect(() => {
      const entry = this.entry();
      const state = this.live.state();
      if (!entry || !state || untracked(this.shown)) return;
      if (worldRideAccess(this.id(), entry, state.workout) === 'show') {
        this.shown.set(true);
      } else {
        void this.router.navigateByUrl(untracked(this.classHref), { replaceUrl: true });
      }
    });
    // The world's own track plays while the ride runs and music is on (L2-128 AC2, AC3).
    effect(() => {
      const world = this.world();
      if (!this.shown() || !world) return;
      this.music.load(world.id);
      this.music.sync(musicPlays(this.live.state()?.workout?.status, this.musicOn()));
    });
    inject(DestroyRef).onDestroy(() => this.music.destroy());
    // A ride too short to save leaves for the dashboard when it ends (L2-109 AC5).
    effect(() => {
      const w = this.live.state()?.workout;
      if (!this.shown() || !w || w.session_id) return;
      if (w.status === 'ended' || w.status === 'ended: bike shut off') {
        untracked(() => void this.router.navigateByUrl('/'));
      }
    });
  }

  private async load(id: string): Promise<void> {
    this.phase.set('loading');
    try {
      const entry = await this.classes.get(id);
      if (entry === 'not-found') {
        this.phase.set('not-found');
        this.title.setTitle('Class not found · Wattzup');
        return;
      }
      this.entry.set(entry);
      if (entry.world) this.title.setTitle(worldById(entry.world).name);
      this.phase.set('ready');
    } catch {
      this.phase.set('not-found');
    }
  }

  protected togglePause(): void {
    void (this.view()?.paused ? this.actions.resume() : this.actions.pause());
  }

  /** − or + sends the level one lower or higher (L2-108 AC2, L2-047). */
  protected step(delta: -1 | 1): void {
    void this.resistance.set(stepLevel(this.live.state(), delta));
  }

  /** `Music` turns the world's track off or on, for every world (L2-128 AC4, AC5). */
  protected toggleMusic(): void {
    this.musicPreference.toggle();
  }

  protected end(): void {
    this.actions.end();
  }

  protected navigate(href: string): void {
    void this.router.navigateByUrl(href);
  }

  /** `See your ride` opens the summary as just finished (L2-085 AC2). */
  protected openSession(href: string): void {
    void this.router.navigateByUrl(href, { state: { justFinished: true } });
  }

  protected reconnect(): void {
    void this.actions.reconnect();
  }
}
