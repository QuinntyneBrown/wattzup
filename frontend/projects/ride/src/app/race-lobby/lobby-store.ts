import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  type LobbySeat,
  MAPS_API,
  type MapDto,
  PROGRESS_API,
  type PackStrengthId,
  type RaceSeatDto,
} from '@telo/api';
import { BOTS_LOBBY_SECONDS, LOBBY_SEATS, LocalLobby, ResistanceController } from '@telo/domain';
import { LiveSessionStore } from '../live/live-session-store';

/** The hint once every seat is taken (L2-051 AC4). */
const START_LINE_HINT = 'Keep pedalling easy. Resistance is set for the first stretch.';

/** The longest a riders-online lobby waits (L2-051 AC5, L2-121 AC1). */
const ONLINE_LOBBY_SECONDS = 30;

/**
 * The race lobby's state (docs/detailed-designs/race/wait-in-the-race-lobby), provided by the page so it goes, with its
 * timer and its hub connection, when the rider leaves.
 *
 * A bots lobby runs in the browser alone (`LocalLobby`): nine bots behind You, every seat taken. The clock holds at
 * 0:05 until "I'm ready", then runs once a second and opens the race at 0:00 (L2-053 AC3).
 *
 * A riders-online lobby asks the ride hub for a seat (`LiveSessionStore`, L2-121 AC1) and draws the session's grid, You
 * first and the others by seat (L2-052 AC1). Its clock counts the whole seconds to the session's server-time start,
 * corrected by the measured offset, on the seconds before it (L2-051 AC5). "I'm ready" and Leave go to the hub.
 *
 * Once every seat is taken the rider is on the start line, and the first stretch's level goes to the bike (L2-051 AC4).
 */
@Injectable()
export class LobbyStore {
  private readonly snapshot = inject(ActivatedRoute).snapshot;
  private readonly router = inject(Router);
  private readonly resistance = inject(ResistanceController);
  private readonly live = inject(LiveSessionStore);
  readonly mapId = this.snapshot.paramMap.get('mapId') ?? '';
  /** Riders online, or bots (L2-048). */
  readonly online = this.snapshot.queryParamMap.get('mode') === 'online';
  /** How hard the bots ride, as Race Setup chose it (L2-049). */
  readonly pack: PackStrengthId =
    (['easy', 'medium', 'hard'] as const).find(
      (pack) => pack === this.snapshot.queryParamMap.get('pack'),
    ) ?? 'medium';

  private readonly catalogue = signal<readonly MapDto[]>([]);
  private readonly level = signal(1);
  private readonly isReady = signal(false);
  private readonly secondsLeft = signal(this.online ? ONLINE_LOBBY_SECONDS : BOTS_LOBBY_SECONDS);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly map = computed(() => this.catalogue().find((map) => map.id === this.mapId) ?? null);
  /** "14.2 km · Riders online" or "14.2 km · Bots, medium" after the map's name (L2-051 AC1). */
  readonly meta = computed(() => {
    const map = this.map();
    if (map === null) return '';
    return `${map.distanceKm.toFixed(1)} km · ${this.online ? 'Riders online' : `Bots, ${this.pack}`}`;
  });
  readonly ready = this.isReady.asReadonly();
  /** Whole seconds to the start. */
  readonly seconds = this.secondsLeft.asReadonly();
  readonly seats = computed<readonly LobbySeat[]>(() =>
    this.online ? this.onlineSeats() : LocalLobby.seats(this.level(), this.isReady()),
  );
  private readonly taken = computed(
    () => this.seats().filter((seat) => seat.kind !== 'open').length,
  );
  private readonly full = computed(() => this.taken() === LOBBY_SEATS);
  readonly status = computed(() => (this.full() ? 'On the start line' : 'Waiting for riders'));
  /** What the rider waits for (L2-051 AC3, AC4). */
  readonly hint = computed(() =>
    this.full()
      ? START_LINE_HINT
      : `${this.taken()} of ${LOBBY_SEATS} seats taken. At 0:10 bots fill the rest so the race starts full.`,
  );
  /** "MarcoVelo left. Their seat is open again." (L2-055 AC1). */
  readonly notice = computed(() => {
    const name = this.live.left();
    return name === null ? null : `${name} left. Their seat is open again.`;
  });
  /** Leave goes back to Race Setup with the same choice (L2-057 AC1). */
  readonly leaveQuery: Readonly<Record<string, string>> = this.online
    ? { mode: 'online' }
    : { mode: 'bots', pack: this.pack };

  constructor() {
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (maps) => this.catalogue.set(maps), error: () => this.catalogue.set([]) });
    inject(PROGRESS_API)
      .level()
      .pipe(takeUntilDestroyed())
      .subscribe((level) => this.level.set(level));
    // On the start line, the first stretch's level goes to the bike, once (L2-051 AC4).
    let sent = false;
    effect(() => {
      const first = this.map()?.plan.segments[0];
      if (sent || !this.full() || first === undefined) return;
      sent = true;
      untracked(() => void this.resistance.applyPlanLevel(first.level));
    });
    if (this.online) {
      void this.live.join({ kind: 'race', mapId: this.mapId });
      // The clock follows the session's start once the hub gives the seat (L2-051 AC5).
      effect(() => {
        const race = this.live.race();
        if (race === null) return;
        untracked(() => this.countDown(Date.parse(race.startsAt)));
      });
    }
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** "I'm ready", or "You're ready" again (L2-053 AC1, AC2). */
  toggleReady(): void {
    const ready = !this.isReady();
    this.isReady.set(ready);
    if (this.online) {
      this.live.setReady(ready);
      return;
    }
    // A bots lobby runs the clock from 0:05, or holds it there again (AC3).
    clearTimeout(this.timer);
    this.secondsLeft.set(BOTS_LOBBY_SECONDS);
    if (ready) this.tick();
  }

  /** Leave releases a riders-online seat; the link itself goes back to Race Setup (L2-057 AC1). */
  leave(): void {
    if (this.online) this.live.leaveRace();
  }

  /** You first at your level, then the riders online and bots by seat, then the open seats (L2-052). */
  private onlineSeats(): readonly LobbySeat[] {
    const own = this.live.race()?.seat ?? null;
    const grid = this.live.seats();
    const mine = grid.find((seat) => seat.number === own);
    const you: LobbySeat = {
      kind: 'you',
      name: 'You',
      jersey: 'you',
      meta: `Lv ${mine?.level ?? this.level()}`,
      ready: mine?.ready ?? false,
    };
    const others = grid.filter((seat) => seat.number !== own).map(seatOf);
    const open: LobbySeat = {
      kind: 'open',
      name: 'Open seat',
      jersey: null,
      meta: null,
      ready: false,
    };
    return [
      you,
      ...others,
      ...Array<LobbySeat>(Math.max(0, LOBBY_SEATS - 1 - others.length)).fill(open),
    ];
  }

  /** The bots lobby's clock: down a second at a time, opening the race at 0:00 (L2-053 AC3). */
  private tick(): void {
    this.timer = setTimeout(() => {
      const left = this.secondsLeft() - 1;
      this.secondsLeft.set(left);
      if (left > 0) this.tick();
      else
        void this.router.navigate(['/race', this.mapId, 'ride'], { queryParams: this.leaveQuery });
    }, 1000);
  }

  /** The riders-online clock: the whole seconds to the start, waking on the seconds before it (L155). */
  private countDown(startsAt: number): void {
    clearTimeout(this.timer);
    const now = this.live.serverNow() ?? Date.now();
    const remaining = startsAt - now;
    this.secondsLeft.set(Math.max(0, Math.ceil(remaining / 1000)));
    if (remaining > 0)
      this.timer = setTimeout(() => this.countDown(startsAt), remaining % 1000 || 1000);
  }
}

/** A seat of the hub's grid as the start grid draws it: a rider at their level, a bot, or open (L2-052 AC2–4). */
function seatOf(seat: RaceSeatDto): LobbySeat {
  switch (seat.kind) {
    case 'open':
      return { kind: 'open', name: 'Open seat', jersey: null, meta: null, ready: false };
    case 'bot':
      return {
        kind: 'bot',
        name: seat.name ?? '',
        jersey: seat.jersey,
        meta: 'Bot',
        ready: seat.ready,
      };
    case 'rider': {
      const level = `Lv ${seat.level ?? 1}`;
      return {
        kind: 'rider',
        name: seat.name ?? '',
        jersey: seat.jersey,
        meta: seat.country ? `${seat.country} · ${level}` : level,
        ready: seat.ready,
      };
    }
  }
}
