import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MAPS_API, type MapDto, PROGRESS_API, type PackStrengthId } from '@telo/api';
import { BOTS_LOBBY_SECONDS, LocalLobby, ResistanceController } from '@telo/domain';

/** The hint once every seat is taken (L2-051 AC4). */
const START_LINE_HINT = 'Keep pedalling easy. Resistance is set for the first stretch.';

/**
 * The race lobby's state (docs/detailed-designs/race/wait-in-the-race-lobby), provided by the page so it goes, with its
 * timer, when the rider leaves. A bots lobby runs in the browser alone (`LocalLobby`): nine bots behind You, every seat
 * taken, so the rider is on the start line and the first stretch's level goes to the bike (L2-051 AC4). The clock holds
 * at 0:05 until "I'm ready", then runs once a second and opens the race at 0:00 (L2-053 AC3).
 */
@Injectable()
export class LobbyStore {
  private readonly snapshot = inject(ActivatedRoute).snapshot;
  private readonly router = inject(Router);
  private readonly resistance = inject(ResistanceController);
  readonly mapId = this.snapshot.paramMap.get('mapId') ?? '';
  /** How hard the bots ride, as Race Setup chose it (L2-049). */
  readonly pack: PackStrengthId =
    (['easy', 'medium', 'hard'] as const).find(
      (pack) => pack === this.snapshot.queryParamMap.get('pack'),
    ) ?? 'medium';

  private readonly catalogue = signal<readonly MapDto[]>([]);
  private readonly level = signal(1);
  private readonly isReady = signal(false);
  private readonly secondsLeft = signal(BOTS_LOBBY_SECONDS);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly map = computed(() => this.catalogue().find((map) => map.id === this.mapId) ?? null);
  /** "14.2 km · Bots, medium" after the map's name (L2-051 AC1). */
  readonly meta = computed(() => {
    const map = this.map();
    return map ? `${map.distanceKm.toFixed(1)} km · Bots, ${this.pack}` : '';
  });
  readonly ready = this.isReady.asReadonly();
  /** Whole seconds to the start. */
  readonly seconds = this.secondsLeft.asReadonly();
  readonly seats = computed(() => LocalLobby.seats(this.level(), this.isReady()));
  private readonly full = computed(() => this.seats().every((seat) => seat.kind !== 'open'));
  readonly status = computed(() => (this.full() ? 'On the start line' : 'Waiting for riders'));
  readonly hint = computed(() => START_LINE_HINT);
  /** Leave goes back to Race Setup with the same choice (L2-057 AC1). */
  readonly leaveQuery = { mode: 'bots', pack: this.pack };

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
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** "I'm ready" runs the clock from 0:05; "You're ready" again holds it at 0:05 (L2-053 AC1–3). */
  toggleReady(): void {
    const ready = !this.isReady();
    this.isReady.set(ready);
    clearTimeout(this.timer);
    this.secondsLeft.set(BOTS_LOBBY_SECONDS);
    if (ready) this.tick();
  }

  private tick(): void {
    this.timer = setTimeout(() => {
      const left = this.secondsLeft() - 1;
      this.secondsLeft.set(left);
      if (left > 0) this.tick();
      else
        void this.router.navigate(['/race', this.mapId, 'ride'], { queryParams: this.leaveQuery });
    }, 1000);
  }
}
