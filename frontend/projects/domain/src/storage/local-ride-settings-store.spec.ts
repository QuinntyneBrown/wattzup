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
  ])('reads %s as the recommended values', (_, raw) => {
    expect(parseRideSettings(raw)).toEqual(RECOMMENDED_SETTINGS);
  });

  it('keeps a valid field and drops an unknown one', () => {
    expect(parseRideSettings('{"keepAwake":false,"theme":7}')).toEqual({
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
