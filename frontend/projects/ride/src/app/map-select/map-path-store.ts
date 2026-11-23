import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAPS_API, type MapDto, type MapProgressDto, MapsApiError, PROGRESS_API } from '@telo/api';

/** Where a map stands on the rider's unlock path. */
export type MapRowState = 'open' | 'next' | 'locked';

/** One row of the path: the map, its state, its stars and best, and its goal while locked. */
export interface MapPathRow {
  readonly map: MapDto;
  readonly state: MapRowState;
  readonly stars: number;
  readonly bestSeconds: number | null;
}

/**
 * Map Select's state, provided on its page (docs/detailed-designs/race/browse-maps): the catalogue joined with the
 * rider's map progress, one row per map in unlock order. With no catalogue to read and none kept it is `unavailable`,
 * and `retry()` asks again (L2-046 AC7). It goes, with its requests, when the rider leaves.
 */
@Injectable()
export class MapPathStore {
  private readonly catalogue = signal<readonly MapDto[] | null>(null);
  private readonly progress = signal<MapProgressDto | null>(null);
  private readonly maps = inject(MAPS_API);
  private readonly destroyRef = inject(DestroyRef);

  /** No catalogue could be read, and none is kept on the device. */
  readonly unavailable = signal(false);

  readonly rows = computed<readonly MapPathRow[]>(() => {
    const maps = this.catalogue();
    const progress = this.progress();
    if (!maps || !progress) return [];
    return maps.map((map) => ({
      map,
      state: progress.openMapIds.includes(map.id)
        ? 'open'
        : progress.nextUnlockId === map.id
          ? 'next'
          : 'locked',
      stars: progress.stars[map.id] ?? 0,
      bestSeconds: progress.bestTimeSeconds[map.id] ?? null,
    }));
  });

  constructor() {
    this.load();
    inject(PROGRESS_API)
      .maps()
      .pipe(takeUntilDestroyed())
      .subscribe((progress) => this.progress.set(progress));
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.unavailable.set(false);
    this.maps
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (maps) => this.catalogue.set(maps),
        error: (error: unknown) =>
          this.unavailable.set(error instanceof MapsApiError && error.code === 'maps_unavailable'),
      });
  }
}
