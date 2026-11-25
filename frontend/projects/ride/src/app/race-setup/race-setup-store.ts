import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FULLSCREEN,
  MAPS_API,
  type MapDto,
  NETWORK_STATUS,
  type MapProgressDto,
  PROGRESS_API,
  type PackStrengthId,
  RACE_QUEUE_API,
  type RaceMode,
  RIDE_SETTINGS,
} from '@telo/api';
import type { ModeOption } from '@telo/components';
import { RaceStartPlanner, enterFullScreenOnStart, multiplayerAvailability } from '@telo/domain';
import { catchError, of, switchMap, timer } from 'rxjs';

/** How often Race Setup asks how many riders are queuing, while Riders online is open (L2-048 AC3). */
const QUEUE_POLL_MS = 10_000;

/**
 * Race Setup's state, provided on its page (docs/detailed-designs/race/set-up-a-race): the map of the address, read
 * from `MAPS_API` (the device's copy when the backend cannot be reached), and the rider's progress on it. It goes, with
 * its requests, when the rider leaves.
 */
@Injectable()
export class RaceSetupStore {
  private readonly snapshot = inject(ActivatedRoute).snapshot;
  private readonly mapId = this.snapshot.paramMap.get('mapId') ?? '';
  private readonly catalogue = signal<readonly MapDto[]>([]);
  private readonly progress = signal<MapProgressDto | null>(null);
  private readonly level = signal(1);
  /** The riders queuing for the map; `undefined` until asked, `null` when the service cannot be reached. */
  private readonly queue = signal<number | null | undefined>(undefined);
  private readonly online = inject(NETWORK_STATUS).online;
  /** Whether riders online can be joined now: not offline, and not refused by the queue's last read (L2-135 AC4). */
  private readonly availability = computed(() =>
    multiplayerAvailability(this.online(), this.queue() !== null),
  );

  /** The map, once the catalogue has arrived. */
  readonly map = computed(() => this.catalogue().find((map) => map.id === this.mapId) ?? null);

  /** "Cathedral Circuit · A cobbled European old town on race day" (L2-047 AC1). */
  readonly routeLine = computed(() => {
    const map = this.map();
    return map ? [map.routeName, map.place].filter(Boolean).join(' · ') : '';
  });

  /** The stars earned here, and the best time, or none (L2-047 AC2, AC4). */
  readonly earned = computed(() => this.progress()?.stars[this.mapId] ?? 0);
  readonly bestSeconds = computed(() => this.progress()?.bestTimeSeconds[this.mapId] ?? null);

  /** The rider's next unlock when its goal is earned on this map, or none (L2-047 AC3). */
  readonly goal = computed(() => {
    const next = this.catalogue().find((map) => map.id === this.progress()?.nextUnlockId);
    return next?.unlockGoal && next.unlockMapId === this.mapId
      ? { goal: next.unlockGoal, opens: next.name }
      : null;
  });

  /**
   * Whom to race (L2-048 AC1): your best time, bots, and riders online, which opens at rider level 3 (AC2) with the
   * riders queuing for the map (AC3); while the browser is offline or the service cannot be reached it says so and
   * stays closed (L2-135 AC4).
   */
  readonly modes = computed<readonly ModeOption[]>(() => [
    {
      id: 'solo',
      title: 'Your best time',
      body: 'Solo. A ghost of your fastest ride sets the pace.',
      icon: 'ghost',
      disabled: false,
    },
    {
      id: 'bots',
      title: 'Bots',
      body: "9 computer riders. Starts the moment you're ready.",
      icon: 'bots',
      disabled: false,
    },
    {
      id: 'online',
      title: 'Riders online',
      body: this.onlineLine(),
      icon: 'riders',
      disabled: this.level() < 3 || this.availability() !== 'open',
    },
  ]);

  /** The rider's choice, Bots by default (L2-048 AC1), or the one "Race it again" carries (`?mode=solo`, L2-079 AC1). */
  private readonly chosen = signal<RaceMode>(
    (['solo', 'bots', 'online'] as const).find(
      (mode) => mode === this.snapshot.queryParamMap.get('mode'),
    ) ?? 'bots',
  );

  /** The chosen mode, or Bots, the default, while a chosen Riders online is closed (L2-135 AC4). */
  readonly mode = computed<RaceMode>(() => {
    const chosen = this.chosen();
    const closed = this.modes().find((mode) => mode.id === 'online')?.disabled ?? false;
    return chosen === 'online' && closed ? 'bots' : chosen;
  });

  /** How hard the bots ride, medium by default (L2-049 AC1), or the one "Race it again" carries (`?pack=hard`). */
  readonly pack = signal<PackStrengthId>(
    (['easy', 'medium', 'hard'] as const).find(
      (pack) => pack === this.snapshot.queryParamMap.get('pack'),
    ) ?? 'medium',
  );

  /** The start the choice leads to, and its button's label (L2-050). */
  readonly light = signal<'daylight' | 'sunrise'>(
    this.snapshot.queryParamMap.get('light') === 'sunrise' ? 'sunrise' : 'daylight',
  );
  readonly hasLightChoice = computed(
    () => this.map()?.world === 'cherryblossom' && this.mode() !== 'online',
  );
  readonly raceStart = computed(() => RaceStartPlanner.plan(this.mapId, this.mode(), this.pack()));

  private readonly router = inject(Router);
  private readonly settings = inject(RIDE_SETTINGS).settings;
  private readonly fullscreen = inject(FULLSCREEN);

  constructor() {
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (maps) => this.catalogue.set(maps), error: () => this.catalogue.set([]) });
    inject(PROGRESS_API)
      .maps()
      .pipe(takeUntilDestroyed())
      .subscribe((progress) => this.progress.set(progress));
    // The rider's level; from level 3 and while the browser is online, the riders queuing for the map, asked at once
    // and again every 10 seconds while the page shows (L2-048 AC2, AC3). Offline it asks nothing (L2-135 AC4).
    inject(PROGRESS_API)
      .level()
      .pipe(takeUntilDestroyed())
      .subscribe((level) => this.level.set(level));
    const queue = inject(RACE_QUEUE_API);
    effect((onCleanup) => {
      if (this.level() < 3 || !this.online()) {
        this.queue.set(undefined);
        return;
      }
      const asking = timer(0, QUEUE_POLL_MS)
        .pipe(switchMap(() => queue.riders(this.mapId).pipe(catchError(() => of(null)))))
        .subscribe((riders) => this.queue.set(riders));
      onCleanup(() => asking.unsubscribe());
    });
  }

  /** "3 riders queuing now. 8–10 per race, empty seats go to bots." (L2-048 AC1, AC3), or why it is closed. */
  private onlineLine(): string {
    if (this.level() < 3) return 'Opens at level 3.';
    if (this.availability() === 'offline') return 'You’re offline. Riders online needs a network.';
    const riders = this.queue();
    if (riders === null) return 'Riders online can’t be reached right now.';
    const field = '8–10 per race, empty seats go to bots.';
    return riders === undefined
      ? field
      : `${riders} ${riders === 1 ? 'rider' : 'riders'} queuing now. ${field}`;
  }

  choose(mode: RaceMode): void {
    this.chosen.set(mode);
  }

  /** Opens the race the choice leads to (L2-050 AC1, AC2), in full screen when Settings asks for it (L2-164 AC6). */
  start(): void {
    enterFullScreenOnStart(this.settings(), this.fullscreen);
    const { route, queryParams } = this.raceStart();
    void this.router.navigate([...route], {
      queryParams:
        this.hasLightChoice() && this.light() === 'sunrise'
          ? { ...queryParams, light: 'sunrise' }
          : queryParams,
    });
  }
}
