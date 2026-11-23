import { TestBed } from '@angular/core/testing';
import { MAPS_KEY_STORAGE, MapsKeyStore } from './maps-key-store';

describe('MapsKeyStore (L2-066 AC3, AC8)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [MapsKeyStore] });
  });
  afterEach(() => vi.restoreAllMocks());

  const store = () => TestBed.inject(MapsKeyStore);

  it('holds no key until one is saved', () => {
    expect(store().get()).toBeNull();
  });

  it('keeps the saved key in this browser', () => {
    store().save('AIzaSyD-key');
    expect(localStorage.getItem(MAPS_KEY_STORAGE)).toBe('AIzaSyD-key');
    expect(store().get()).toBe('AIzaSyD-key');
  });

  it('counts a blank record as no key', () => {
    localStorage.setItem(MAPS_KEY_STORAGE, '   ');
    expect(store().get()).toBeNull();
  });

  it('counts storage the browser refuses as no key, and saves nothing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => store().save('AIzaSyD-key')).not.toThrow();
    expect(store().get()).toBeNull();
  });
});
