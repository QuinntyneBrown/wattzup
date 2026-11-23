import { TestBed } from '@angular/core/testing';
import { type ProgressDto, RIDER_PROGRESS_API } from '@telo/api';
import { type Observable, of, throwError } from 'rxjs';
import { RiderProgressStore } from './rider-progress-store';

// Traces to: L2-044 AC1
// The rider's progress, read from the backend: nothing until it arrives, the answer once it has, and nothing while it
// cannot be read; each refresh reads it again.
describe('RiderProgressStore', () => {
  const mid: ProgressDto = {
    level: 7,
    totalXp: 1840,
    nextLevelXp: 2600,
    streakDays: 0,
    openMapIds: ['prairie-paceline', 'old-town-criterium'],
    nextUnlockId: 'cliffside-coast',
    stars: {},
    bestTimeSeconds: {},
    nextRideMapId: 'prairie-paceline',
    unseenUnlockId: null,
    rideCount: 0,
    distanceKm: 0,
  };
  let answer: () => Observable<ProgressDto>;
  let reads: number;

  function store(): RiderProgressStore {
    TestBed.configureTestingModule({
      providers: [
        RiderProgressStore,
        {
          provide: RIDER_PROGRESS_API,
          useValue: { progress: () => (reads++, answer()) },
        },
      ],
    });
    return TestBed.inject(RiderProgressStore);
  }

  beforeEach(() => {
    reads = 0;
    answer = () => of(mid);
  });

  it('has no progress before it is read', () => {
    expect(store().progress()).toBeNull();
    expect(reads).toBe(0);
  });

  it('holds the progress the backend answers', () => {
    const progress = store();
    progress.refresh();
    expect(progress.progress()).toEqual(mid);
  });

  it('reads it again on each refresh', () => {
    const progress = store();
    progress.refresh();
    answer = () => of({ ...mid, level: 8, totalXp: 2602 });
    progress.refresh();
    expect(reads).toBe(2);
    expect(progress.progress()?.level).toBe(8);
  });

  it('holds nothing while the progress cannot be read', () => {
    const progress = store();
    progress.refresh();
    answer = () => throwError(() => new Error('503'));
    progress.refresh();
    expect(progress.progress()).toBeNull();
  });
});
