import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  CLASSES_API,
  type ClassDto,
  type ClassSessionDto,
  NETWORK_STATUS,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import { catchError, of, switchMap, timer } from 'rxjs';
import type { RideOption } from '@telo/components';
import { PlanSummary, multiplayerAvailability } from '@telo/domain';
import { groupSessionView } from './group-session-view';

/** How often Class Start reads the group sessions again (L2-083 AC2). */
const SESSIONS_EVERY = 30_000;

/**
 * Class Start's state, provided on its page (docs/detailed-designs/classes/start-a-class): the class of the address,
 * read from `CLASSES_API` (the device's copy when the backend cannot be reached), what the page says of it, and its
 * video parked at the sync offset; and the class's next group sessions, read every 30 seconds (L2-083 AC2). It goes,
 * with the player and the polling, when the rider leaves.
 */
@Injectable()
export class ClassStartStore {
  private readonly loaded = signal<ClassDto | null>(null);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private player: VideoPlayer | null = null;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  /** The class, once it has arrived. */
  readonly dto = this.loaded.asReadonly();

  /** "GCN Training · 30 min · HIIT" (L2-084 AC1). */
  readonly meta = computed(() => {
    const dto = this.loaded();
    return dto ? `${dto.channel} · ${Math.round(dto.lengthSeconds / 60)} min · ${dto.focus}` : '';
  });

  /** The next two group sessions and when they were read; `null` while they cannot be read (L2-085 AC5). */
  private readonly sessions = signal<{
    readonly list: readonly ClassSessionDto[];
    readonly at: number;
  } | null>(null);
  private readonly chosen = signal<string | null>(null);
  private readonly online = inject(NETWORK_STATUS).online;
  /** Whether a group can be joined now: not offline, and the sessions' last read reached the service (L2-135 AC4). */
  private readonly availability = computed(() =>
    multiplayerAvailability(this.online(), this.sessions() !== null),
  );

  /** The next group session's words, or `null` when there is none to offer. */
  readonly group = computed(() => {
    const sessions = this.sessions();
    return sessions && this.availability() === 'open'
      ? groupSessionView(sessions.list, sessions.at)
      : null;
  });

  /**
   * The ways to ride (L2-085): alone; with a group, reading the next session, which cannot be chosen while the sessions
   * cannot be read (AC5) or the browser is offline, saying which (L2-135 AC4).
   */
  readonly options = computed<readonly RideOption[]>(() => {
    const group = this.group();
    return [
      {
        id: 'alone',
        title: 'Ride alone',
        body: 'Start now. Pause whenever you like.',
        icon: 'alone',
        disabled: false,
      },
      {
        id: 'group',
        title: 'Ride with a group',
        body:
          this.availability() === 'offline'
            ? 'You’re offline. Group classes need a network.'
            : (group?.optionBody ?? 'Group sessions can’t be reached right now.'),
        icon: 'group',
        disabled: group === null,
      },
    ];
  });

  /** The chosen way to ride: the group, as the mocks open, while a session can be joined; alone otherwise. */
  readonly mode = computed(() => {
    const chosen = this.chosen() ?? 'group';
    return chosen === 'group' && this.group() === null ? 'alone' : chosen;
  });

  /** "8 × 0:30 · 3:00 → 1:30 recover · ~154 W average" (L2-084 AC2). */
  readonly planSummary = computed(() => {
    const segments = this.loaded()?.plan.segments ?? [];
    return `${PlanSummary.structure(segments)} · ~${PlanSummary.averagePower(segments)} W average`;
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    const classes = inject(CLASSES_API);
    classes
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => this.loaded.set(dto));
    // Read at once and every 30 seconds while the browser is online; offline nothing is asked (L2-135 AC4), and back
    // online they are read again at once.
    effect((onCleanup) => {
      if (!this.online()) {
        this.sessions.set(null);
        return;
      }
      const reading = timer(0, SESSIONS_EVERY)
        .pipe(switchMap(() => classes.sessions(id).pipe(catchError(() => of(null)))))
        .subscribe((list) => this.sessions.set(list ? { list, at: Date.now() } : null));
      onCleanup(() => reading.unsubscribe());
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.player?.destroy();
    });
  }

  choose(mode: string): void {
    this.chosen.set(mode);
  }

  /**
   * Parks the class video in `host` at its sync offset with YouTube's controls, waiting for the rider (L2-084 AC1);
   * called once the frame is drawn.
   */
  parkVideo(host: HTMLElement): void {
    const dto = this.loaded();
    if (!dto || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player = player;
        void player.load(host, dto.video.videoId, {
          startSeconds: dto.video.syncOffsetSeconds,
          controls: true,
          autoplay: false,
          title: `Video: ${dto.title}`,
        });
      },
      // Without the player the cover stays, and the class can still be ridden.
      () => undefined,
    );
  }
}
