// Unit test
// Traces to: L2-046 AC7; L2-135 AC3; ADR 0029
// Description: the map catalogue is asked of the backend and kept; when the backend cannot be reached the kept
// catalogue answers, and without one the refusal is maps_unavailable; a kept record that is not a list counts as none.
import { TestBed } from '@angular/core/testing';
import { HttpMapsApi, type MapDto, type MapsApiError } from '@telo/api';
import { type Observable, firstValueFrom, of, throwError } from 'rxjs';
import { CachedMapsApi } from './cached-maps-api';
import { MAP_CATALOGUE_KEY, MapCatalogueCache } from './map-catalogue-cache';

const served = [
  { id: 'prairie-paceline', name: 'Prairie Paceline' },
] as unknown as readonly MapDto[];
const unreachable = () => throwError(() => new Error('503'));

describe('CachedMapsApi', () => {
  let answer: () => Observable<readonly MapDto[]>;
  let api: CachedMapsApi;

  beforeEach(() => {
    localStorage.clear();
    answer = () => of(served);
    TestBed.configureTestingModule({
      providers: [
        CachedMapsApi,
        MapCatalogueCache,
        { provide: HttpMapsApi, useValue: { list: () => answer() } },
      ],
    });
    api = TestBed.inject(CachedMapsApi);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  const refusal = async (from: Observable<unknown>) =>
    ((await firstValueFrom(from).catch((error: unknown) => error)) as MapsApiError).code;

  it('answers what the backend serves, and keeps it', async () => {
    expect(await firstValueFrom(api.list())).toEqual(served);
    expect(JSON.parse(localStorage.getItem(MAP_CATALOGUE_KEY)!)).toEqual(served);
  });

  it('answers the kept catalogue when the backend cannot be reached', async () => {
    await firstValueFrom(api.list());
    answer = unreachable;
    expect(await firstValueFrom(api.list())).toEqual(served);
  });

  it('refuses with maps_unavailable when the backend cannot be reached and none is kept', async () => {
    answer = unreachable;
    expect(await refusal(api.list())).toBe('maps_unavailable');
  });

  it('counts a kept record that is not a list of maps as none', async () => {
    localStorage.setItem(MAP_CATALOGUE_KEY, JSON.stringify({ maps: 'none' }));
    answer = unreachable;
    expect(await refusal(api.list())).toBe('maps_unavailable');
  });
});
