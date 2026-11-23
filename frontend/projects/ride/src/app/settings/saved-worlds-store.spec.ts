// Unit test
// Traces to: L2-165 AC1, AC2
// Description: the store lists the saved worlds when Settings opens; clearing deletes them, lists again and raises the
// toast with the bytes freed, which closes after 6 seconds or when dismissed, and its timer goes with the page.
import { TestBed } from '@angular/core/testing';
import { SAVED_WORLDS, type SavedWorld } from '@telo/api';
import { SavedWorldsStore, TOAST_MS } from './saved-worlds-store';

describe('SavedWorldsStore', () => {
  let worlds: SavedWorld[];
  let store: SavedWorldsStore;

  beforeEach(async () => {
    vi.useFakeTimers();
    worlds = [
      { id: 'prairie', name: 'Prairie Paceline', bytes: 18_900_000 },
      { id: 'oldtown', name: 'Old Town Criterium', bytes: 24_300_000 },
    ];
    TestBed.configureTestingModule({
      providers: [
        SavedWorldsStore,
        {
          provide: SAVED_WORLDS,
          useValue: {
            list: async () => [...worlds],
            clear: async () => void (worlds = []),
          },
        },
      ],
    });
    store = TestBed.inject(SavedWorldsStore);
    await vi.advanceTimersByTimeAsync(0);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('lists the saved worlds when it starts (AC1)', () => {
    expect(store.view()?.value).toBe('2 worlds · 43 MB');
    expect(store.freed()).toBeNull();
  });

  it('clears them, reads None saved and raises the toast with the bytes freed, for 6 seconds (AC2)', async () => {
    await store.clear();

    expect(store.view()?.value).toBe('None saved');
    expect(store.freed()).toBe('43 MB');
    await vi.advanceTimersByTimeAsync(TOAST_MS - 1);
    expect(store.freed()).toBe('43 MB');
    await vi.advanceTimersByTimeAsync(1);
    expect(store.freed()).toBeNull();
  });

  it('closes the toast when dismissed', async () => {
    await store.clear();

    store.dismiss();

    expect(store.freed()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets its timer go with the page', async () => {
    await store.clear();

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
  });
});
