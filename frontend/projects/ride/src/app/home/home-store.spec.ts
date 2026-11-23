// Unit test
// Traces to: L2-036 AC1, AC3
// Description: Home's store announces a map a ride opened once it can name it, tells the backend once that the banner
// was seen, and keeps the banner for the rest of the visit when the progress is read again without it.
import { TestBed } from '@angular/core/testing';
import {
  CLASSES_API,
  CURRENT_RIDER,
  MAPS_API,
  type MapDto,
  PROGRESS_STORE,
  type ProgressDto,
  RIDER_PROGRESS_API,
} from '@telo/api';
import { signal } from '@angular/core';
import { NEVER, of } from 'rxjs';
import { HomeStore } from './home-store';

const docklands = {
  id: 'neon-docklands',
  name: 'Neon Docklands',
  place: 'A harbour city after dark',
  distanceKm: 21.6,
} as MapDto;

const unseen = {
  unseenUnlockId: 'neon-docklands',
  openMapIds: [],
  stars: {},
  bestTimeSeconds: {},
} as unknown as ProgressDto;

describe('HomeStore', () => {
  let progress: ReturnType<typeof signal<ProgressDto | null>>;
  let seen: string[];

  function store(): HomeStore {
    progress = signal<ProgressDto | null>(null);
    seen = [];
    TestBed.configureTestingModule({
      providers: [
        HomeStore,
        { provide: PROGRESS_STORE, useValue: { progress, refresh: () => undefined } },
        { provide: CURRENT_RIDER, useValue: { rider: signal(null) } },
        { provide: MAPS_API, useValue: { list: () => of([docklands]) } },
        { provide: CLASSES_API, useValue: { list: () => NEVER } },
        {
          provide: RIDER_PROGRESS_API,
          useValue: { markUnlockSeen: (mapId: string) => (seen.push(mapId), of(undefined)) },
        },
      ],
    });
    return TestBed.inject(HomeStore);
  }

  it('has no banner until the progress names a map a ride opened', () => {
    const home = store();
    TestBed.tick();
    expect(home.banner()).toBeNull();
    expect(seen).toEqual([]);
  });

  it('announces the map and tells the backend once that the banner was seen', () => {
    const home = store();
    progress.set(unseen);
    TestBed.tick();
    progress.set({ ...unseen });
    TestBed.tick();

    expect(home.banner()?.title).toBe('Neon Docklands is open.');
    expect(seen).toEqual(['neon-docklands']);
  });

  it('keeps the banner for the visit when the progress is read again without it', () => {
    const home = store();
    progress.set(unseen);
    TestBed.tick();
    progress.set({ ...unseen, unseenUnlockId: null });
    TestBed.tick();

    expect(home.banner()?.mapId).toBe('neon-docklands');
  });
});
