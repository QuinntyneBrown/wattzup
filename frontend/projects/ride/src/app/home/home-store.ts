import { Injectable, computed, effect, inject, linkedSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  CLASSES_API,
  CURRENT_RIDER,
  MAPS_API,
  PROGRESS_STORE,
  RIDER_PROGRESS_API,
} from '@telo/api';
import { catchError, of } from 'rxjs';
import { classDoorView } from './class-door-view';
import { homeGreeting } from './home-greeting';
import { nextRideView } from './next-ride-view';
import { raceDoorView } from './race-door-view';
import { unlockBannerView } from './unlock-banner-view';

/**
 * Home's state, provided on its page (docs/detailed-designs/home/choose-the-next-ride): the rider's progress, shared
 * with the header, joined with the map and class catalogues. The greeting follows the hour Home opened at; the Next ride card and
 * the Race door wait for both the progress and the catalogue, and are absent while either cannot be read.
 */
@Injectable()
export class HomeStore {
  private readonly progress = inject(PROGRESS_STORE).progress;
  private readonly rider = inject(CURRENT_RIDER).rider;
  private readonly maps = toSignal(
    inject(MAPS_API)
      .list()
      .pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly classes = toSignal(
    inject(CLASSES_API)
      .list()
      .pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly hour = new Date().getHours();
  private markedSeen = false;

  /** A new rider has no XP yet (L2-033 AC3). */
  readonly isNewRider = computed(() => this.progress()?.totalXp === 0);

  readonly greeting = computed(() =>
    homeGreeting(this.rider()?.displayName ?? null, this.hour, this.isNewRider()),
  );

  /** The first map the progress names as opened and not yet announced; kept for the visit once named. */
  private readonly announced = linkedSignal<string | null, string | null>({
    source: () => this.progress()?.unseenUnlockId ?? null,
    computation: (unseen, previous) => previous?.value ?? unseen,
  });

  /** The unlocked banner (L2-036), once the catalogue can name the map. */
  readonly banner = computed(() => {
    const mapId = this.announced();
    const maps = this.maps();
    return mapId && maps ? unlockBannerView(mapId, maps) : null;
  });

  readonly nextRide = computed(() => {
    const progress = this.progress();
    const maps = this.maps();
    return progress && maps ? nextRideView(progress, maps) : null;
  });

  readonly raceDoor = computed(() => {
    const progress = this.progress();
    const maps = this.maps();
    return progress && maps ? raceDoorView(progress, maps) : null;
  });

  /** The Classes door waits only for the catalogue: its featured class opens at level 1 (L2-035). */
  readonly classDoor = computed(() => {
    const classes = this.classes();
    return classes ? classDoorView(classes, this.progress()?.level ?? 1) : null;
  });

  constructor() {
    // Once the banner shows, the backend hears it was seen, once, so no device shows it again (L2-036 AC3).
    const api = inject(RIDER_PROGRESS_API);
    const seen$ = takeUntilDestroyed<void>();
    effect(() => {
      const banner = this.banner();
      if (!banner || this.markedSeen) return;
      this.markedSeen = true;
      api
        .markUnlockSeen(banner.mapId)
        .pipe(seen$)
        .subscribe({ error: () => undefined });
    });
  }
}
