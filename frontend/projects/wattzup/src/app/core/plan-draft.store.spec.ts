import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAN_DRAFT_KEY, PlanDraftStore, readDraft, readIntervalsDraft } from './plan-draft.store';
import { DEFAULT_INTERVALS, applyIntervalPreset } from './intervals-form';
import { DEFAULT_DRAFT, applyPreset } from './plan-form';

describe('readDraft', () => {
  it('returns the default for a missing key or unreadable data', () => {
    expect(readDraft(null)).toBe(DEFAULT_DRAFT);
    expect(readDraft('{not json')).toBe(DEFAULT_DRAFT);
  });

  it('returns the default for data of the wrong shape', () => {
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, workLevel: 40 }))).toBe(DEFAULT_DRAFT);
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, mode: 'sprint' }))).toBe(DEFAULT_DRAFT);
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, rounds: 8 }))).toBe(DEFAULT_DRAFT);
  });

  it('restores a stored draft', () => {
    const draft = applyPreset(DEFAULT_DRAFT, 'tabata');
    expect(readDraft(JSON.stringify(draft))).toEqual(draft);
  });
});

describe('PlanDraftStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves and loads through localStorage', () => {
    const store = TestBed.inject(PlanDraftStore);
    const draft = applyPreset(DEFAULT_DRAFT, 'long-climbs');
    store.save(draft);
    expect(localStorage.getItem(PLAN_DRAFT_KEY)).toContain('long-climbs');
    expect(store.load()).toEqual(draft);
  });

  it('falls back to the default when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(TestBed.inject(PlanDraftStore).load()).toEqual(DEFAULT_DRAFT);
  });
});

describe('readIntervalsDraft (L2-029 AC16)', () => {
  it('keeps the Intervals mode of the bike draft', () => {
    const d = { ...DEFAULT_DRAFT, mode: 'intervals' as const };
    expect(readDraft(JSON.stringify(d))).toEqual(d);
  });

  it('reads a stored draft back', () => {
    const d = applyIntervalPreset(DEFAULT_INTERVALS, 'even');
    expect(readIntervalsDraft(JSON.stringify(d))).toEqual(d);
  });

  it.each([
    null,
    '{',
    '[]',
    JSON.stringify({ ...DEFAULT_INTERVALS, preset: 'tabata' }),
    JSON.stringify({ ...DEFAULT_INTERVALS, sets: [] }),
    JSON.stringify({
      ...DEFAULT_INTERVALS,
      warmup: { on: 'yes', seconds: 300, level: 8, cadence: 80 },
    }),
    JSON.stringify({ ...DEFAULT_INTERVALS, sets: [{ ...DEFAULT_INTERVALS.sets[0], rounds: 31 }] }),
    JSON.stringify({
      ...DEFAULT_INTERVALS,
      sets: [{ ...DEFAULT_INTERVALS.sets[0], rest_seconds: 3 }],
    }),
  ])('falls back to the default for %s', (raw) => {
    expect(readIntervalsDraft(raw)).toBe(DEFAULT_INTERVALS);
  });
});
