import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  type ClassResult,
  MAPS_API,
  type MapDto,
  RIDE_OUTBOX,
  type RaceResult,
  type RideSyncState,
  type SubmitRideRequest,
} from '@telo/api';
import { Button, MapStars, ResultsHeader, Standings, UnlockCard, XpEarned } from '@telo/components';
import { type ResultsView, resultsView } from './results-view';

/** What a finished ride leaves in the navigation's state for Results: its result and the ride as it was submitted. */
interface ResultsState {
  readonly raceResult?: RaceResult;
  readonly classResult?: ClassResult;
  readonly ride?: SubmitRideRequest;
}

const SENDING = signal<RideSyncState>({ kind: 'sending' }).asReadonly();

/**
 * Results (docs/mocks/pages/results/, L2-073 to L2-079): where the rider finished, the final standings, what the ride
 * earned and what to ride next. The ride hands its result and the ride itself over in the navigation's history state,
 * which a reload keeps; with no result the rider goes Home. Results submits the ride to the outbox too, which keeps it
 * on the device until the backend has it (L2-135) and sends a ride id once: after a reload the backend answers the
 * repeat as it answered the first time. When the answer names a map the ride opened, Results reads the catalogue, only then, for
 * the unlock card. From lg it is two columns, the result and then what was earned, with the actions below.
 */
@Component({
  selector: 'wz-results-page',
  imports: [RouterLink, Button, MapStars, ResultsHeader, Standings, UnlockCard, XpEarned],
  templateUrl: './results-page.html',
  styleUrl: './results-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResultsPage {
  protected readonly view: () => ResultsView | null;

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ResultsState;
    const result = state.raceResult ?? state.classResult ?? null;
    const outbox = inject(RIDE_OUTBOX);
    if (state.ride) outbox.submit(state.ride);
    const sync = state.ride ? outbox.status(state.ride.rideId) : SENDING;
    const maps = inject(MAPS_API);
    const openedMapId = computed(() => {
      const now = sync();
      return now.kind === 'recorded' ? now.answer.openedMapId : null;
    });
    // The catalogue only once the answer names an opened map; one that cannot be read leaves the card out, and the rest
    // of Results stands. Leaving Results ends the request.
    const openedMap = signal<MapDto | null>(null);
    effect((onCleanup) => {
      const mapId = openedMapId();
      if (mapId === null) return;
      const reading = maps.list().subscribe({
        next: (list) => openedMap.set(list.find((known) => known.id === mapId) ?? null),
        error: () => undefined,
      });
      onCleanup(() => reading.unsubscribe());
    });
    this.view = computed(() => (result === null ? null : resultsView(result, sync(), openedMap())));
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }
}
