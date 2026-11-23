// Unit test
// Traces to: L2-080 AC3; L2-135 AC3
// Description: the catalogue is asked of the backend and kept; when the backend cannot be reached the kept catalogue
// answers, and without one the refusal is catalogue_unavailable; a class is found in the catalogue or refused with
// class_not_found; a kept record that is not a catalogue counts as none.
import { TestBed } from '@angular/core/testing';
import type { ClassesApiError } from '@telo/api';
import { type ClassCatalogueDto, HttpClassesApi } from '@telo/api';
import { type Observable, firstValueFrom, of, throwError } from 'rxjs';
import { CATALOGUE_KEY, CatalogueCache } from './catalogue-cache';
import { CachedClassesApi } from './cached-classes-api';

const hiit = { id: 'hiit-cardio-30', title: '30 Minute HIIT Cardio' };
const served = { shelves: [{ id: '30-min' }], classes: [hiit] } as unknown as ClassCatalogueDto;
const unreachable = () => throwError(() => new Error('503'));

describe('CachedClassesApi', () => {
  let answer: () => Observable<ClassCatalogueDto>;
  let api: CachedClassesApi;

  beforeEach(() => {
    localStorage.clear();
    answer = () => of(served);
    TestBed.configureTestingModule({
      providers: [
        CachedClassesApi,
        CatalogueCache,
        { provide: HttpClassesApi, useValue: { list: () => answer() } },
      ],
    });
    api = TestBed.inject(CachedClassesApi);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  const refusal = async (from: Observable<unknown>) =>
    ((await firstValueFrom(from).catch((error: unknown) => error)) as ClassesApiError).code;

  it('answers what the backend serves, and keeps it', async () => {
    expect(await firstValueFrom(api.list())).toEqual(served);
    expect(JSON.parse(localStorage.getItem(CATALOGUE_KEY)!)).toEqual(served);
  });

  it('answers the kept catalogue when the backend cannot be reached', async () => {
    await firstValueFrom(api.list());
    answer = unreachable;
    expect(await firstValueFrom(api.list())).toEqual(served);
  });

  it('refuses with catalogue_unavailable when the backend cannot be reached and none is kept', async () => {
    answer = unreachable;
    expect(await refusal(api.list())).toBe('catalogue_unavailable');
  });

  it('finds a class in the catalogue, from the kept one too', async () => {
    expect(await firstValueFrom(api.get('hiit-cardio-30'))).toEqual(hiit);
    answer = unreachable;
    expect(await firstValueFrom(api.get('hiit-cardio-30'))).toEqual(hiit);
  });

  it('refuses with class_not_found for a class the catalogue does not hold', async () => {
    expect(await refusal(api.get('no-such-class'))).toBe('class_not_found');
  });

  it('counts a kept record that is not a catalogue as none', async () => {
    localStorage.setItem(CATALOGUE_KEY, '{"classes":"none"}');
    answer = unreachable;
    expect(await refusal(api.list())).toBe('catalogue_unavailable');
  });
});
