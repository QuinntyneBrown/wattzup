import { TestBed } from '@angular/core/testing';
import {
  LocalRideSettingsStore,
  RECOMMENDED_SETTINGS,
  RIDE_SETTINGS_KEY,
  parseRideSettings,
} from './local-ride-settings-store';

describe('parseRideSettings (L2-158 AC5)', () => {
  it.each([
    ['nothing stored', null],
    ['JSON it cannot parse', '{not json'],
    ['a value that is not an object', '42'],
    ['null', 'null'],
    ['a field of the wrong type', '{"keepAwake":"no"}'],
    ['a level that is not one', '{"quality":"epic"}'],
    ['a frame rate that is not one', '{"frameRate":"60"}'],
    ['a resolution below 50 %', '{"resolution":45}'],
    ['a resolution above 100 %', '{"resolution":105}'],
    ['a resolution off the 5 % steps', '{"resolution":72}'],
    ['a graphics API that is not one', '{"graphics":"webgpu"}'],
    ['a device check that is not an object', '{"deviceCheck":"high"}'],
    [
      'a device check at no level',
      '{"deviceCheck":{"level":"epic","displayFps":60,"tried":[],"checkedAt":"2026-11-22T19:31:00Z"}}',
    ],
    [
      'a device check with no display rate',
      '{"deviceCheck":{"level":"high","tried":[],"checkedAt":"2026-11-22T19:31:00Z"}}',
    ],
    [
      'a device check with a trial of no rate',
      '{"deviceCheck":{"level":"high","displayFps":60,"tried":[{"level":"ultra"}],"checkedAt":"2026-11-22T19:31:00Z"}}',
    ],
    ['a ride sound volume below 0 %', '{"rideSoundVolume":-5}'],
    ['a ride sound volume above 100 %', '{"rideSoundVolume":105}'],
    ['a ride sound volume off the 5 % steps', '{"rideSoundVolume":42}'],
    ['a reduce motion that is not a choice', '{"reduceMotion":true}'],
    ['a theme that is not a choice', '{"theme":"blue"}'],
    ['ride numbers that are not a size', '{"rideNumbers":"huge"}'],
    ['a full screen choice of the wrong type', '{"fullScreenOnStart":"yes"}'],
    ['a keep worlds choice of the wrong type', '{"keepWorlds":1}'],
    ['a race announcer choice of the wrong type', '{"raceAnnouncer":"yes"}'],
    ['an announcer voice that is not a preset', '{"announcerVoice":"robot"}'],
    ['an announcer volume below 0 %', '{"announcerVolume":-5}'],
    ['an announcer volume above 100 %', '{"announcerVolume":105}'],
    ['an announcer volume off the 5 % steps', '{"announcerVolume":73}'],
    ['an announcer captions choice of the wrong type', '{"announcerCaptions":1}'],
    [
      'a device check with no time',
      '{"deviceCheck":{"level":"high","displayFps":60,"tried":[],"checkedAt":"soon"}}',
    ],
  ])('reads %s as the recommended values', (_, raw) => {
    expect(parseRideSettings(raw)).toEqual(RECOMMENDED_SETTINGS);
  });

  it('keeps a valid field and drops an unknown one', () => {
    expect(parseRideSettings('{"keepAwake":false,"wheelSize":7}')).toEqual({
      ...RECOMMENDED_SETTINGS,
      keepAwake: false,
    });
  });

  it('keeps every valid World setting', () => {
    const world = {
      quality: 'medium',
      stepDown: false,
      frameRate: '30',
      resolution: 55,
      graphics: 'webgl2',
    };
    expect(parseRideSettings(JSON.stringify(world))).toEqual({ ...RECOMMENDED_SETTINGS, ...world });
  });

  it('keeps Sound and Motion and display as stored (L2-163 AC1, L2-164)', () => {
    const chosen = {
      rideSound: false,
      rideSoundVolume: 0,
      worldMusic: false,
      muteUnderVideo: false,
      reduceMotion: 'off',
      theme: 'light',
      rideNumbers: 'large',
      keepAwake: false,
      fullScreenOnStart: true,
    };
    expect(parseRideSettings(JSON.stringify(chosen))).toEqual({
      ...RECOMMENDED_SETTINGS,
      ...chosen,
    });
  });

  it('keeps Keep worlds after a ride as stored, on by default (L2-165 AC3)', () => {
    expect(RECOMMENDED_SETTINGS.keepWorlds).toBe(true);
    expect(parseRideSettings('{"keepWorlds":false}')).toEqual({
      ...RECOMMENDED_SETTINGS,
      keepWorlds: false,
    });
  });

  it('keeps Race announcer settings as stored, with safe defaults (L2-169 AC1, AC5)', () => {
    expect(RECOMMENDED_SETTINGS.raceAnnouncer).toBe(false);
    expect(RECOMMENDED_SETTINGS.announcerVoice).toBe('arcade');
    expect(RECOMMENDED_SETTINGS.announcerVolume).toBe(85);
    expect(RECOMMENDED_SETTINGS.announcerCaptions).toBe(true);
    const chosen = {
      raceAnnouncer: true,
      announcerVoice: 'coach' as const,
      announcerVolume: 60,
      announcerCaptions: false,
    };
    expect(parseRideSettings(JSON.stringify(chosen))).toEqual({
      ...RECOMMENDED_SETTINGS,
      ...chosen,
    });
  });

  it('keeps a whole device check result (L2-162 AC3)', () => {
    const deviceCheck = {
      level: 'high',
      displayFps: 60,
      tried: [{ level: 'ultra', fps: 41 }],
      checkedAt: '2026-11-22T19:31:00.000Z',
    };
    expect(parseRideSettings(JSON.stringify({ deviceCheck }))).toEqual({
      ...RECOMMENDED_SETTINGS,
      deviceCheck,
    });
  });
});

describe('LocalRideSettingsStore (L2-158 AC3, AC6, AC7)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [LocalRideSettingsStore] });
  });
  afterEach(() => vi.restoreAllMocks());

  const store = () => TestBed.inject(LocalRideSettingsStore);

  it('starts with what this browser keeps', () => {
    localStorage.setItem(RIDE_SETTINGS_KEY, '{"keepAwake":false}');
    expect(store().settings()).toEqual({ ...RECOMMENDED_SETTINGS, keepAwake: false });
    expect(store().persisted()).toBe(true);
  });

  it('applies a change at once and keeps it', () => {
    store().set('keepAwake', false);
    expect(store().settings().keepAwake).toBe(false);
    expect(JSON.parse(localStorage.getItem(RIDE_SETTINGS_KEY) ?? '{}')).toEqual({
      ...RECOMMENDED_SETTINGS,
      keepAwake: false,
    });
  });

  it('resets every setting to its recommended value and keeps that', () => {
    store().set('keepAwake', false);
    store().reset();
    expect(store().settings()).toEqual(RECOMMENDED_SETTINGS);
    expect(localStorage.getItem(RIDE_SETTINGS_KEY)).toBe(JSON.stringify(RECOMMENDED_SETTINGS));
  });

  it('when the browser refuses storage, keeps the settings for the tab and says they are not kept', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(store().persisted()).toBe(false);
    expect(store().settings()).toEqual(RECOMMENDED_SETTINGS);
    store().set('keepAwake', false);
    expect(store().settings().keepAwake).toBe(false);
  });

  it('says the settings are not kept when only writing is refused', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(store().persisted()).toBe(true);
    store().set('keepAwake', false);
    expect(store().persisted()).toBe(false);
  });
});
