// Unit test
// Traces to: L2-164 AC2, AC3, AC4
// Description: reduce motion and the theme follow this device under Match device and the rider's choice otherwise,
// following the device's changes as they come; <html> carries the theme, the motion and the ride numbers at once,
// and the media queries are let go when the owner goes.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RIDE_SETTINGS, type RideSettings } from '@telo/api';
import { RECOMMENDED_SETTINGS } from '../storage/local-ride-settings-store';
import { BrowserDisplayPreferences } from './browser-display-preferences';

/** A fake `matchMedia`: each query matches as told, and can be told it changed. */
function fakeMedia(matching: Record<string, boolean>) {
  const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>();
  vi.stubGlobal('matchMedia', (query: string) => {
    const set = listeners.get(query) ?? new Set();
    listeners.set(query, set);
    return {
      matches: matching[query] ?? false,
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        set.add(listener),
      removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        set.delete(listener),
    };
  });
  return {
    change: (query: string, matches: boolean) =>
      listeners.get(query)?.forEach((listener) => listener({ matches })),
    listening: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
}

const REDUCE = '(prefers-reduced-motion: reduce)';
const LIGHT = '(prefers-color-scheme: light)';

describe('BrowserDisplayPreferences', () => {
  let settings: ReturnType<typeof signal<RideSettings>>;

  function preferences(chosen: Partial<RideSettings>): BrowserDisplayPreferences {
    settings = signal({ ...RECOMMENDED_SETTINGS, ...chosen });
    TestBed.configureTestingModule({
      providers: [
        BrowserDisplayPreferences,
        { provide: RIDE_SETTINGS, useValue: { settings, persisted: signal(true) } },
      ],
    });
    const display = TestBed.inject(BrowserDisplayPreferences);
    TestBed.tick();
    return display;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it.each([
    ['device', false, false],
    ['device', true, true],
    ['on', false, true],
    ['on', true, true],
    ['off', false, false],
    ['off', true, false],
  ] as const)('reduce motion %s, the device asking %s: reduced is %s', (choice, asks, reduced) => {
    fakeMedia({ [REDUCE]: asks });
    const display = preferences({ reduceMotion: choice });

    expect(display.deviceReducesMotion()).toBe(asks);
    expect(display.reducedMotion()).toBe(reduced);
    expect(document.documentElement.dataset['motion']).toBe(reduced ? 'reduced' : 'full');
  });

  it.each([
    ['device', false, 'dark'],
    ['device', true, 'light'],
    ['dark', true, 'dark'],
    ['light', false, 'light'],
  ] as const)(
    'theme %s, the device asking for light %s: the theme is %s',
    (choice, light, theme) => {
      fakeMedia({ [LIGHT]: light });
      const display = preferences({ theme: choice });

      expect(display.theme()).toBe(theme);
      expect(document.documentElement.dataset['theme']).toBe(theme);
    },
  );

  it('follows the device when it changes its mind under Match device', () => {
    const media = fakeMedia({});
    const display = preferences({});

    media.change(REDUCE, true);
    media.change(LIGHT, true);
    TestBed.tick();

    expect(display.reducedMotion()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('marks the ride numbers on <html>, and a change at once (AC4)', () => {
    fakeMedia({});
    preferences({});
    expect(document.documentElement.dataset['rideNumbers']).toBe('standard');

    settings.update((current) => ({ ...current, rideNumbers: 'large' }));
    TestBed.tick();

    expect(document.documentElement.dataset['rideNumbers']).toBe('large');
  });

  it('stops listening to the device when its owner goes', () => {
    const media = fakeMedia({});
    preferences({});
    expect(media.listening()).toBe(2);

    TestBed.resetTestingModule();

    expect(media.listening()).toBe(0);
  });
});
